const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Add pdf-lib import if not present
if (!code.includes('pdf-lib')) {
  code = code.replace("import zlib from 'zlib';", "import zlib from 'zlib';\nimport { PDFDocument, PDFRawStream, decodePDFRawStream, PDFArray } from 'pdf-lib';");
}

const oldUploadRegex = /app\.post\('\/api\/upload', \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Error analyzing documents\.' \}\);\n  \}\n  \}\);\n\}\);\n/m;
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
      let bwPageList: number[] = [];

      const ext = path.extname(f.originalname).toLowerCase();
      const fileBuffer = f.buffer; // using memoryStorage

      if (ext === '.pdf') {
        try {
          const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          pageCount = pdfDoc.getPageCount();
          bwPages = 0;
          colorPages = 0;
          colorPageList = [];
          bwPageList = [];

          const pages = pdfDoc.getPages();

          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            let isColor = false;
            const pageNum = i + 1;

            try {
              // 1. Check Content Stream operators
              const contentsRef = page.node.Contents();
              if (contentsRef) {
                const contents = pdfDoc.context.lookup(contentsRef);
                let arr: any[] = [];
                if (contents instanceof PDFArray) {
                  for (let j = 0; j < contents.size(); j++) {
                    arr.push(pdfDoc.context.lookup(contents.get(j)));
                  }
                } else {
                  arr.push(contents);
                }

                for (const stream of arr) {
                  if (stream instanceof PDFRawStream) {
                    const decoded = decodePDFRawStream(stream).decode();
                    const str = Buffer.from(decoded).toString('utf8');

                    // Check for RGB color (rg / RG)
                    const rgbRegex = /([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+(rg|RG)\\b/g;
                    let match;
                    while ((match = rgbRegex.exec(str)) !== null) {
                      const r = parseFloat(match[1]);
                      const g = parseFloat(match[2]);
                      const b = parseFloat(match[3]);
                      if (r !== g || g !== b) {
                        isColor = true;
                        break;
                      }
                    }

                    // Check for CMYK color (k / K)
                    if (!isColor) {
                      const cmykRegex = /([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+(k|K)\\b/g;
                      while ((match = cmykRegex.exec(str)) !== null) {
                        const c = parseFloat(match[1]);
                        const m = parseFloat(match[2]);
                        const y = parseFloat(match[3]);
                        if (c > 0 || m > 0 || y > 0) {
                          isColor = true;
                          break;
                        }
                      }
                    }
                  }
                  if (isColor) break;
                }
              }

              // 2. Check Images / XObjects
              if (!isColor) {
                const resources = page.node.Resources();
                if (resources) {
                  const resDict = pdfDoc.context.lookup(resources) as any;
                  if (resDict && typeof resDict.get === 'function') {
                    const xobjRef = resDict.get(pdfDoc.context.obj('XObject'));
                    if (xobjRef) {
                      const xobjects = pdfDoc.context.lookup(xobjRef) as any;
                      if (xobjects && typeof xobjects.keys === 'function') {
                        const keys = xobjects.keys();
                        for (let k = 0; k < keys.length; k++) {
                          const xobj = pdfDoc.context.lookup(xobjects.get(keys[k])) as any;
                          if (xobj && typeof xobj.dict?.get === 'function') {
                            const subtype = xobj.dict.get(pdfDoc.context.obj('Subtype'));
                            if (subtype && subtype.toString() === '/Image') {
                              const cs = xobj.dict.get(pdfDoc.context.obj('ColorSpace'));
                              if (cs) {
                                const csStr = cs.toString();
                                if (!csStr.includes('/DeviceGray') && 
                                   (csStr.includes('/DeviceRGB') || csStr.includes('/DeviceCMYK') || csStr.includes('/ICCBased'))) {
                                  isColor = true;
                                  break;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error(\`Page \${pageNum} analysis error:\`, err);
            }

            if (isColor) {
              colorPages++;
              colorPageList.push(pageNum);
            } else {
              bwPages++;
              bwPageList.push(pageNum);
            }
          }
        } catch (e) {
          console.error('PDF parsing error', e);
        }
      } else if (['.docx', '.pptx', '.odt'].includes(ext)) {
        pageCount = getOfficeDocPageCount(fileBuffer, ext);
        bwPages = pageCount;
        colorPages = 0;
        bwPageList = Array.from({length: pageCount}, (_, i) => i + 1);
      } else {
        bwPages = pageCount;
        bwPageList = [1];
      }

      return {
        id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        pageCount,
        bwPages,
        bwPageList,
        colorPages,
        colorPageList,
        printType: colorPages > 0 ? 'Color' : 'B&W',
        printMode: 'hybrid', // Default to hybrid billing
        url: \`/uploads/\${f.filename || 'mem'}\`
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

code = code.replace(oldUploadRegex, newUploadHandler);
fs.writeFileSync('server.ts', code);
console.log('Patched server.ts upload');
