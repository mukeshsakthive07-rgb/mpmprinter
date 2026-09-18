import multer from 'multer';
import fs from 'fs';
import zlib from 'zlib';
import JSZip from 'jszip';
import { PDFDocument, PDFRawStream, decodePDFRawStream, PDFArray } from 'pdf-lib';

import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

interface AuthRequest extends Request {
  user?: import('./src/types').UserProfile;
  token?: string;
}


const sseClients: any[] = [];

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const user = db.validateToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const app = express();
app.use(compression());

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-transform');
  next();
});


app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send("self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', () => { self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => { clients.forEach(client => client.navigate(client.url)) }); });");
});
app.get('/dev-dist/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send("self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', () => { self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => { clients.forEach(client => client.navigate(client.url)) }); });");
});


// --- ADMIN AUTHORIZATION ---
const ADMIN_EMAILS = [
  'mukeshsakthive07@gmail.com',
  'mukeshsakthivel07@gmail.com'
];
if (process.env.ADMIN_EMAIL) {
  ADMIN_EMAILS.push(process.env.ADMIN_EMAIL);
}

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Decode JWT payload (Base64Url encoded)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    if (ADMIN_EMAILS.includes(payload.email)) {
      return res.json({ success: true, isAdmin: true, email: payload.email });
    } else {
      return res.status(403).json({ error: 'Access Denied: You do not have admin privileges.', isAdmin: false });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token structure.' });
  }
});

const PORT = 3000;

// Increase body limit to support multi-document attachments (PDF, images, etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up local file storage for large document uploads (bypassing Firestore 1MB limit)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Google Search Console Site Verification Endpoint
app.get('/googleb0dde4f546b9379a.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('google-site-verification: googleb0dde4f546b9379a.html');
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit per file
});


/**
 * Extracts accurate page counts and color page metrics from a PDF file buffer using pdf-lib,
 * with fallback mechanisms for encrypted or non-standard PDFs.
 */
async function extractPdfMetadata(fileBuffer: Buffer): Promise<{
  pageCount: number;
  bwPages: number;
  bwPageList: number[];
  colorPages: number;
  colorPageList: number[];
}> {
  let pageCount = 1;
  let bwPages = 1;
  let colorPages = 0;
  let colorPageList: number[] = [];
  let bwPageList: number[] = [1];

  try {
    // Primary engine: pdf-lib (parses full object tree & catalog)
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
      parseSpeed: 1,
      throwOnInvalidObject: false
    });

    const totalDocPages = pdfDoc.getPageCount();
    if (typeof totalDocPages === 'number' && totalDocPages > 0) {
      pageCount = totalDocPages;
      bwPages = 0;
      colorPages = 0;
      colorPageList = [];
      bwPageList = [];

      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNum = i + 1;
        let isColor = false;

        try {
          // Check Content Stream operators for color
          const contentsRef = page.node.Contents();
          if (contentsRef) {
            const contents = pdfDoc.context.lookup(contentsRef);
            let arr: any[] = [];
            if (contents instanceof PDFArray) {
              for (let j = 0; j < contents.size(); j++) {
                arr.push(pdfDoc.context.lookup(contents.get(j)));
              }
            } else if (contents) {
              arr.push(contents);
            }

            for (const stream of arr) {
              if (stream instanceof PDFRawStream) {
                const decoded = decodePDFRawStream(stream).decode();
                const str = Buffer.from(decoded).toString('utf8');

                // RGB color operators: r g b rg / r g b RG
                const rgbRegex = /([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+(rg|RG)\b/g;
                let match;
                while ((match = rgbRegex.exec(str)) !== null) {
                  const r = parseFloat(match[1]);
                  const g = parseFloat(match[2]);
                  const b = parseFloat(match[3]);
                  if (Math.abs(r - g) > 0.02 || Math.abs(g - b) > 0.02) {
                    isColor = true;
                    break;
                  }
                }

                // CMYK color operators: c m y k k / K
                if (!isColor) {
                  const cmykRegex = /([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+(k|K)\b/g;
                  while ((match = cmykRegex.exec(str)) !== null) {
                    const c = parseFloat(match[1]);
                    const m = parseFloat(match[2]);
                    const y = parseFloat(match[3]);
                    if (c > 0.02 || m > 0.02 || y > 0.02) {
                      isColor = true;
                      break;
                    }
                  }
                }

                // Color space operators: /DeviceRGB or /DeviceCMYK cs/CS
                if (!isColor && /\/(DeviceRGB|DeviceCMYK|CalRGB)\s+(cs|CS)\b/.test(str)) {
                  isColor = true;
                }
              }
              if (isColor) break;
            }
          }

          // Check page Resources dictionary for color references
          if (!isColor && page.node.Resources()) {
            const resObj = pdfDoc.context.lookup(page.node.Resources());
            if (resObj && typeof resObj.toString === 'function') {
              const resStr = resObj.toString();
              if (/DeviceRGB|DeviceCMYK|CalRGB/.test(resStr)) {
                isColor = true;
              }
            }
          }
        } catch (e) {
          // If stream parsing fails for this individual page, keep default
        }

        if (isColor) {
          colorPages++;
          colorPageList.push(pageNum);
        } else {
          bwPages++;
          bwPageList.push(pageNum);
        }
      }

      return { pageCount, bwPages, bwPageList, colorPages, colorPageList };
    }
  } catch (pdfLibErr) {
    console.warn('pdf-lib parsing failed, falling back to structural extraction:', pdfLibErr);
  }

  // Fallback: Structural extraction from buffer (e.g. encrypted or damaged PDFs)
  try {
    const bufStr = fileBuffer.toString('latin1');
    let detectedCount = 0;

    // Pattern 1: /Type /Pages ... /Count N
    const pagesCountMatch = bufStr.match(/\/Type\s*\/Pages[\s\S]{0,1000}?\/Count\s+(\d+)/i) ||
                            bufStr.match(/\/Count\s+(\d+)[\s\S]{0,1000}?\/Type\s*\/Pages/i);
    if (pagesCountMatch && pagesCountMatch[1]) {
      detectedCount = parseInt(pagesCountMatch[1], 10);
    }

    // Pattern 2: Count individual /Type /Page objects (not /Pages)
    if (!detectedCount || detectedCount <= 0) {
      const pageObjs = bufStr.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
      if (pageObjs && pageObjs.length > 0) {
        detectedCount = pageObjs.length;
      }
    }

    // Pattern 3: Fallback generic /Count
    if (!detectedCount || detectedCount <= 0) {
      const genericCount = bufStr.match(/\/Count\s+(\d+)/);
      if (genericCount && genericCount[1]) {
        detectedCount = parseInt(genericCount[1], 10);
      }
    }

    pageCount = Math.max(1, detectedCount);
    const hasColorProfiles = /DeviceRGB|DeviceCMYK|CalRGB|ICCBased/i.test(bufStr);

    if (hasColorProfiles) {
      colorPages = pageCount;
      colorPageList = Array.from({ length: pageCount }, (_, i) => i + 1);
      bwPages = 0;
      bwPageList = [];
    } else {
      bwPages = pageCount;
      bwPageList = Array.from({ length: pageCount }, (_, i) => i + 1);
      colorPages = 0;
      colorPageList = [];
    }
  } catch (fallbackErr) {
    console.error('Fallback PDF parser failed:', fallbackErr);
    pageCount = 1;
    bwPages = 1;
    bwPageList = [1];
    colorPages = 0;
    colorPageList = [];
  }

  return { pageCount, bwPages, bwPageList, colorPages, colorPageList };
}

app.post('/api/upload', (req, res) => {
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
        let bwPageList: number[] = [1];

        const ext = path.extname(f.originalname).toLowerCase();
        const fileBuffer = f.buffer;

        // Save uploaded document to disk so it can be previewed/downloaded by the receiver
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(uploadDir, safeFilename);
        try {
          fs.writeFileSync(filePath, fileBuffer);
        } catch (writeErr) {
          console.error('Failed to save file to disk:', writeErr);
        }

        if (ext === '.pdf') {
          const pdfInfo = await extractPdfMetadata(fileBuffer);
          pageCount = pdfInfo.pageCount;
          bwPages = pdfInfo.bwPages;
          colorPages = pdfInfo.colorPages;
          colorPageList = pdfInfo.colorPageList;
          bwPageList = pdfInfo.bwPageList;
        } 
        else if (ext === '.docx' || ext === '.odt') {
          try {
            const zip = await JSZip.loadAsync(fileBuffer);
            
            let appContent = '';
            let docContent = '';
            
            const appXml = zip.file('docProps/app.xml');
            if (appXml) {
              appContent = await appXml.async('string');
            }
            
            const documentXml = zip.file('word/document.xml');
            if (documentXml) {
              docContent = await documentXml.async('string');
            }
            
            let declaredPages = 1;
            let words = 0, lines = 0, characters = 0, paragraphs = 0;
            
            if (appContent) {
              const pagesMatch = appContent.match(/<Pages>(\d+)<\/Pages>/i);
              if (pagesMatch) declaredPages = parseInt(pagesMatch[1], 10);
              const wordsMatch = appContent.match(/<Words>(\d+)<\/Words>/i);
              if (wordsMatch) words = parseInt(wordsMatch[1], 10);
              const linesMatch = appContent.match(/<Lines>(\d+)<\/Lines>/i);
              if (linesMatch) lines = parseInt(linesMatch[1], 10);
              const charsMatch = appContent.match(/<Characters>(\d+)<\/Characters>/i);
              if (charsMatch) characters = parseInt(charsMatch[1], 10);
              const parasMatch = appContent.match(/<Paragraphs>(\d+)<\/Paragraphs>/i);
              if (parasMatch) paragraphs = parseInt(parasMatch[1], 10);
            }
            
            let pagesFromBreaks = 1;
            if (docContent) {
              const renderedBreaks = (docContent.match(/<w:lastRenderedPageBreak/g) || []).length;
              const explicitBreaks = (docContent.match(/<w:br[^>]*w:type="page"/g) || []).length;
              const sectPr = (docContent.match(/<w:sectPr/g) || []).length;
              const totalBreaks = renderedBreaks + explicitBreaks + sectPr;
              pagesFromBreaks = totalBreaks > 0 ? totalBreaks + 1 : 1;
            }
            
            const estimatedFromWords = words > 0 ? Math.ceil(words / 280) : 1;
            const estimatedFromLines = lines > 0 ? Math.ceil(lines / 38) : 1;
            const estimatedFromChars = characters > 0 ? Math.ceil(characters / 1600) : 1;
            const estimatedFromParagraphs = paragraphs > 0 ? Math.ceil(paragraphs / 32) : 1;
            
            if (declaredPages > 1 && (words === 0 || declaredPages >= Math.floor(estimatedFromWords * 0.5))) {
              pageCount = declaredPages;
            } else {
              pageCount = Math.max(pagesFromBreaks, estimatedFromWords, estimatedFromLines, estimatedFromChars, estimatedFromParagraphs, 1);
            }
            
            bwPages = 0;
            colorPages = 0;
            colorPageList = [];
            bwPageList = [];
            
            if (docContent) {
              const pageContents = docContent.split(/(?:<w:lastRenderedPageBreak[^>]*>|<w:br[^>]*w:type="page"[^>]*>|<w:sectPr)/);
              
              pageContents.forEach((pageXml, index) => {
                const pageNum = index + 1;
                // If this is beyond the max pageCount (e.g. parser split error), just count it against the last page or ignore.
                // We'll trust pageCount instead and map the first `pageContents.length` pages.
                
                let isColor = false;
                
                const colorMatches = pageXml.match(/<w:color w:val="([^"]+)"/g) || [];
                for (const match of colorMatches) {
                  const val = match.replace('<w:color w:val="', '').replace('"', '');
                  if (val !== 'auto' && val !== '000000' && val !== 'FFFFFF') {
                    if (val.length === 6) {
                      const r = val.substring(0, 2);
                      const g = val.substring(2, 4);
                      const b = val.substring(4, 6);
                      if (r !== g || g !== b) {
                        isColor = true;
                        break;
                      }
                    } else {
                      isColor = true;
                      break;
                    }
                  }
                }
                
                if (!isColor && /<w:highlight w:val="([^"]+)"/.test(pageXml)) {
                  isColor = true;
                }
                
                if (!isColor && (/<w:drawing>/.test(pageXml) || /<a:blip/.test(pageXml) || /<v:imagedata/.test(pageXml))) {
                  isColor = true; 
                }
                
                if (pageNum <= pageCount) {
                  if (isColor) {
                    colorPages++;
                    colorPageList.push(pageNum);
                  } else {
                    bwPages++;
                    bwPageList.push(pageNum);
                  }
                } else if (pageNum > pageCount && isColor) {
                   // if we found color in a trailing fragment, make sure we at least mark the last valid page as color
                   if (bwPageList.includes(pageCount)) {
                       bwPageList = bwPageList.filter(p => p !== pageCount);
                       bwPages--;
                       colorPages++;
                       colorPageList.push(pageCount);
                   }
                }
              });
              
              // Fill the rest of the pages up to pageCount with B&W
              const mappedPages = colorPages + bwPages;
              if (pageCount > mappedPages) {
                  const extra = pageCount - mappedPages;
                  bwPages += extra;
                  for (let j = 1; j <= extra; j++) {
                      bwPageList.push(mappedPages + j);
                  }
              } else if (mappedPages > pageCount) {
                  // Fallback in case of logic edge cases
                  pageCount = mappedPages;
              }
            } else {
                bwPages = pageCount;
                bwPageList = Array.from({length: pageCount}, (_, i) => i + 1);
            }
          } catch (e) {
            console.error('DOCX parsing error', e);
          }
        }
        else if (ext === '.pptx' || ext === '.odp') {
          try {
            const zip = await JSZip.loadAsync(fileBuffer);
            
            // Count slide files
            const slideFiles = Object.keys(zip.files).filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/));
            
            if (slideFiles.length > 0) {
              pageCount = slideFiles.length;
            } else {
                const appXml = zip.file('docProps/app.xml');
                if (appXml) {
                  const appContent = await appXml.async('string');
                  const slidesMatch = appContent.match(/<Slides>(\d+)<\/Slides>/i);
                  if (slidesMatch) {
                    pageCount = parseInt(slidesMatch[1], 10);
                  }
                }
            }
            
            bwPages = 0;
            colorPages = 0;
            colorPageList = [];
            bwPageList = [];
            
            // Sort to ensure correct page numbering
            slideFiles.sort((a, b) => {
              const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
              const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
              return numA - numB;
            });
            
            for (let i = 0; i < slideFiles.length; i++) {
              const slideFile = zip.file(slideFiles[i]);
              if (!slideFile) continue;
              
              const slideXml = await slideFile.async('string');
              const pageNum = i + 1;
              let isColor = false;
              
              // Check for rgb colors
              const colorMatches = slideXml.match(/<a:srgbClr val="([^"]+)"/g) || [];
              for (const match of colorMatches) {
                const val = match.replace('<a:srgbClr val="', '').replace('"', '');
                if (val !== '000000' && val !== 'FFFFFF') {
                  if (val.length === 6) {
                    const r = val.substring(0, 2);
                    const g = val.substring(2, 4);
                    const b = val.substring(4, 6);
                    if (r !== g || g !== b) {
                      isColor = true;
                      break;
                    }
                  } else {
                    isColor = true;
                    break;
                  }
                }
              }
              
              // Check for images
              if (!isColor && (/<p:pic>/.test(slideXml) || /<a:blip/.test(slideXml))) {
                isColor = true;
              }
              
              if (isColor) {
                colorPages++;
                colorPageList.push(pageNum);
              } else {
                bwPages++;
                bwPageList.push(pageNum);
              }
            }
            
            if (slideFiles.length === 0 && pageCount > 0) {
                 bwPages = pageCount;
                 bwPageList = Array.from({length: pageCount}, (_, i) => i + 1);
            }
          } catch (e) {
            console.error('PPTX parsing error', e);
          }
        }
        else if (ext === '.xlsx') {
           try {
              const zip = await JSZip.loadAsync(fileBuffer);
              const sheetFiles = Object.keys(zip.files).filter(name => name.match(/^xl\/worksheets\/sheet\d+\.xml$/));
              pageCount = Math.max(1, sheetFiles.length);
              bwPages = pageCount;
              colorPages = 0;
              bwPageList = Array.from({length: pageCount}, (_, i) => i + 1);
           } catch (e) {
              console.error('XLSX parsing error', e);
           }
        }
        else if (ext === '.txt') {
           try {
              const textContent = fileBuffer.toString('utf-8');
              const lines = textContent.split('\n').length;
              pageCount = Math.max(1, Math.ceil(lines / 45));
              bwPages = pageCount;
              colorPages = 0;
              bwPageList = Array.from({length: pageCount}, (_, i) => i + 1);
           } catch (e) {
              console.error('TXT parsing error', e);
           }
        }
        else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          // Images are 1 page. Default to Color unless specifically printed B&W later.
          pageCount = 1;
          colorPages = 1;
          colorPageList = [1];
          bwPages = 0;
          bwPageList = [];
        }
        else {
          // Other fallback (.rtf, etc.)
          pageCount = 1;
          bwPages = 1;
          colorPages = 0;
          colorPageList = [];
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
          url: `/uploads/${safeFilename}`
        };
      }));

      res.status(200).json({ success: true, files: uploadedFiles });
    } catch (err) {
      console.error('File parsing error:', err);
      res.status(500).json({ error: 'Error analyzing documents.' });
    }
  });
});

// Update order status
app.patch('/api/orders/:orderId/status', authenticateToken, (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'printing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status.' });
  }

  const updated = db.updateOrderStatus(orderId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json({ message: `Order #${orderId} status changed to ${status}.`, order: updated });
});

// Delete order permanently
// CRITICAL: Must be permanently deleted from database and disappear everywhere,
// with a deletion notification sent to user and synchronized across devices.
app.delete('/api/orders/:orderId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const result = db.deleteOrder(orderId, req.user!.id);

  if (!result.success) {
    return res.status(404).json({ error: 'Order not found or permission denied.' });
  }

  res.json({
    message: `Order #${orderId} deleted permanently from the database.`,
    orderId,
  });
});

// ==========================================
// 3. NOTIFICATIONS ENDPOINTS
// ==========================================

app.get('/api/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifications = db.getUserNotifications(req.user!.id);
  res.json({ notifications });
});

app.patch('/api/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id, req.user!.id);
  res.json({ success });
});

app.post('/api/notifications/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  db.markAllNotificationsAsRead(req.user!.id);
  res.json({ success: true, message: 'All notifications marked as read.' });
});

app.delete('/api/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  db.clearAllNotifications(req.user!.id);
  res.json({ success: true, message: 'All notifications cleared.' });
});

// ==========================================
// 4. USER SETTINGS ENDPOINTS
// ==========================================

app.get('/api/settings', authenticateToken, (req: AuthRequest, res: Response) => {
  const settings = db.getUserSettings(req.user!.id);
  res.json({ settings });
});

app.put('/api/settings', authenticateToken, (req: AuthRequest, res: Response) => {
  const updated = db.updateUserSettings(req.user!.id, req.body);
  res.json({ message: 'Settings saved successfully.', settings: updated });
});

app.get('/api/settings/export', authenticateToken, (req: AuthRequest, res: Response) => {
  const data = db.exportUserData(req.user!.id);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mm-printer-export-${req.user!.id}.json"`);
  res.send(JSON.stringify(data, null, 2));
});

// ==========================================
// 5. HELP & SUPPORT SUBMISSION
// ==========================================

app.post('/api/support/submit', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  // Create acknowledgement notification
  db.createNotification({
    userId: req.user!.id,
    title: 'Support Request Received 📩',
    message: `Thank you ${name || req.user!.name}. Your support query "${subject}" has been received by Mugilan & Mukesh. We will respond shortly.`,
    type: 'system',
  });

  res.json({
    message: 'Thank you! Your message has been submitted to MM PRINTER support desk.',
  });
});


// ==========================================
// PRICING RATES API
// ==========================================


let cachedRates = null;
let cachedRatesTime = 0;
app.get('/api/rates', (req, res) => {
  if (Date.now() - cachedRatesTime < 60000 && cachedRates) {
    return res.json({ rates: cachedRates });
  }
  try {
    cachedRates = db.getPrintRates();
    cachedRatesTime = Date.now();
    res.json({ rates: cachedRates });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});


app.post('/api/admin/rates', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    if (!ADMIN_EMAILS.includes(payload.email)) {
      return res.status(403).json({ error: 'Only admins can update rates.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token structure.' });
  }

  db.updatePrintRates(req.body.rates);
  cachedRates = null; // Invalidate cache
  res.json({ success: true, rates: db.getPrintRates() });
});

// ==========================================
// 6. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ==========================================

app.get('/api/sync/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const token = req.query.token as string;
  const user = token ? db.validateToken(token) : null;

  const client = { res, userId: user?.id };
  sseClients.push(client);

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(client);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ==========================================
// 7. VITE MIDDLEWARE & SERVER START
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Static assets maxAge
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          // Cache other static assets (JS, CSS with hash) for 1 year
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MM PRINTER server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
