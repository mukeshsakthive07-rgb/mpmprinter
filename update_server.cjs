const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// Add compression import
serverCode = serverCode.replace("import express, { Request, Response, NextFunction } from 'express';", "import express, { Request, Response, NextFunction } from 'express';\nimport compression from 'compression';");

// Add compression middleware
serverCode = serverCode.replace("const app = express();", "const app = express();\napp.use(compression());");

// Replace multer storage from disk to memory
serverCode = serverCode.replace(/const storage = multer\.diskStorage\(\{[\s\S]*?\}\);/m, 'const storage = multer.memoryStorage();');

// Replace `getOfficeDocPageCount`
const fastOfficeReplacement = `function getOfficeDocPageCount(buffer: Buffer, ext: string): number {
  try {
    // Fast scan from the end of the ZIP buffer to find Central Directory
    const str = buffer.toString('utf8', Math.max(0, buffer.length - 8192));
    const match = str.match(/<Pages>(\\d+)<\\/Pages>/i) || str.match(/<meta:document-statistic[^>]*page-count="(\\d+)"/i);
    if (match && match[1]) return parseInt(match[1], 10);
    
    // Fallback naive search
    const fullStr = buffer.toString('utf8');
    const fullMatch = fullStr.match(/<Pages>(\\d+)<\\/Pages>/i) || fullStr.match(/<meta:document-statistic[^>]*page-count="(\\d+)"/i);
    if (fullMatch && fullMatch[1]) return parseInt(fullMatch[1], 10);
  } catch (e) {
    console.error('Office page count error', e);
  }
  return 1;
}

function fastPdfPageCount(buffer: Buffer): number {
  try {
    const str = buffer.toString('utf8');
    const countMatch = str.match(/\/Type\\s*\/Page[^s]/g);
    if (countMatch) return countMatch.length;
    
    const countAttr = str.match(/\/Count\\s+(\\d+)/);
    if (countAttr && countAttr[1]) return parseInt(countAttr[1], 10);
  } catch (e) { }
  return 1;
}

function fastPdfColorDetect(buffer: Buffer): { colorPages: number, bwPages: number, colorPageList: number[] } {
  // Ultra-fast heuristic: bypass deep image decompression, search for CMYK/RGB profiles
  try {
    const str = buffer.toString('utf8');
    const isColor = /DeviceRGB|DeviceCMYK|CalRGB|ICCBased/.test(str);
    const pages = fastPdfPageCount(buffer);
    if (isColor) {
      return { colorPages: pages, bwPages: 0, colorPageList: Array.from({length: pages}, (_, i) => i + 1) };
    }
    return { colorPages: 0, bwPages: pages, colorPageList: [] };
  } catch(e) { }
  return { colorPages: 0, bwPages: 1, colorPageList: [] };
}`;

serverCode = serverCode.replace(/function getOfficeDocPageCount[\s\S]*?return 1;\n\}/m, fastOfficeReplacement);

// Replace the upload handler
const oldUploadRegex = /app\.post\('\/api\/upload', \(req, res\) => \{[\s\S]*?(?=\/\/ Update order status)/;
const newUploadHandler = `app.post('/api/upload', (req, res) => {
  upload.array('files', 50)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 25MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Unknown upload error occurred.' });
    }
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  
  try {
    const uploadedFiles = await Promise.all(req.files.map(async (f: any) => {
      let pageCount = 1;
      let bwPages = 1;
      let colorPages = 0;
      let colorPageList: number[] = [];

      const ext = path.extname(f.originalname).toLowerCase();
      const fileBuffer = f.buffer; // We are now using memoryStorage

      if (ext === '.pdf') {
        pageCount = fastPdfPageCount(fileBuffer);
        const colorData = fastPdfColorDetect(fileBuffer);
        bwPages = colorData.bwPages;
        colorPages = colorData.colorPages;
        colorPageList = colorData.colorPageList;
        
        // Correct edge cases where heuristic fails
        if (colorPages + bwPages === 0 || colorPages + bwPages !== pageCount) {
           bwPages = pageCount - colorPages;
           if (bwPages < 0) { bwPages = 0; colorPages = pageCount; }
        }
      } else if (['.docx', '.pptx', '.odt'].includes(ext)) {
        pageCount = getOfficeDocPageCount(fileBuffer, ext);
        bwPages = pageCount;
        colorPages = 0;
      }

      // Convert buffer to base64 for the DB mock, or just store a ref.
      // Since it's an in-memory DB or Firestore, we don't store the full buffer to avoid memory leaks.
      // Assuming db.createOrder handles the actual file ref later, we just return metadata.
      return {
        id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        pageCount,
        bwPages,
        colorPages,
        colorPageList,
        printType: colorPages > 0 ? 'Color' : 'B&W'
      };
    }));

    res.status(200).json({ success: true, files: uploadedFiles });
  } catch (err) {
    console.error('File parsing error:', err);
    res.status(500).json({ error: 'Error analyzing documents.' });
  }
  });
});

`;

serverCode = serverCode.replace(oldUploadRegex, newUploadHandler);

fs.writeFileSync('server.ts', serverCode);
console.log('Successfully updated server.ts');
