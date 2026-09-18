const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const startString = `app.post('/api/upload', (req, res) => {`;
const endString = `    res.status(200).json({ success: true, files: uploadedFiles });
    } catch (err) {
      console.error('File parsing error:', err);
      res.status(500).json({ error: 'Error analyzing documents.' });
    }
  });
});`;

const startIndex = code.indexOf(startString);
const endIndex = code.indexOf(endString) + endString.length;

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find upload block");
    process.exit(1);
}

const replacementCode = `app.post('/api/upload', (req, res) => {
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
        const fileBuffer = f.buffer;

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
                // Check Content Stream operators
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
                      // Check for CMYK (k / K)
                      if (!isColor) {
                        const cmykRegex = /([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+(k|K)\\b/g;
                        while ((match = cmykRegex.exec(str)) !== null) {
                          const c = parseFloat(match[1]);
                          const m = parseFloat(match[2]);
                          const y = parseFloat(match[3]);
                          if (c > 0.01 || m > 0.01 || y > 0.01) {
                            isColor = true;
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                // Stream parse error
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
        } 
        else if (ext === '.docx' || ext === '.odt') {
          try {
            const zip = await JSZip.loadAsync(fileBuffer);
            
            let xmlPages = 0;
            let words = 0;
            let characters = 0;
            
            const appXml = zip.file('docProps/app.xml');
            if (appXml) {
              const appContent = await appXml.async('string');
              const pagesMatch = appContent.match(/<Pages>(\\d+)<\\/Pages>/i);
              if (pagesMatch) xmlPages = parseInt(pagesMatch[1], 10);
              
              const wordsMatch = appContent.match(/<Words>(\\d+)<\\/Words>/i);
              if (wordsMatch) words = parseInt(wordsMatch[1], 10);
              
              const charsMatch = appContent.match(/<Characters>(\\d+)<\\/Characters>/i);
              if (charsMatch) characters = parseInt(charsMatch[1], 10);
            }
            
            let estimatedPages = 1;
            if (xmlPages > 1) {
              estimatedPages = xmlPages;
            } else if (words > 0) {
              estimatedPages = Math.max(1, Math.ceil(words / 300));
            } else if (characters > 0) {
              estimatedPages = Math.max(1, Math.ceil(characters / 1800));
            }

            const documentXml = zip.file('word/document.xml');
            if (documentXml) {
              const xmlContent = await documentXml.async('string');
              
              // Count pages based on rendered page breaks + hard page breaks + 1 for the first page
              const lastRenderedMatches = xmlContent.match(/<w:lastRenderedPageBreak\\s*\\/?>/g);
              const hardBreakMatches = xmlContent.match(/<w:br w:type="page"\\s*\\/?>/g);
              
              const breakCount = (lastRenderedMatches ? lastRenderedMatches.length : 0) + (hardBreakMatches ? hardBreakMatches.length : 0);
              
              pageCount = Math.max(estimatedPages, 1 + breakCount);
              
              // Split content by page breaks to analyze color per page
              const pageContents = xmlContent.split(/<w:lastRenderedPageBreak\\s*\\/?>|<w:br w:type="page"\\s*\\/?>/);
              
              bwPages = 0;
              colorPages = 0;
              colorPageList = [];
              bwPageList = [];
              
              pageContents.forEach((pageXml, index) => {
                const pageNum = index + 1;
                let isColor = false;
                
                // Check text color (ignore auto, 000000, FFFFFF, and grayscale)
                const colorMatches = pageXml.match(/<w:color w:val="([^"]+)"/g) || [];
                for (const match of colorMatches) {
                  const val = match.replace('<w:color w:val="', '').replace('"', '');
                  if (val !== 'auto' && val !== '000000' && val !== 'FFFFFF') {
                    // Check if it's grayscale (R == G == B)
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
                
                // Check highlight
                if (!isColor && /<w:highlight w:val="([^"]+)"/.test(pageXml)) {
                  isColor = true;
                }
                
                // Check drawing/images
                if (!isColor && (/<w:drawing>/.test(pageXml) || /<a:blip/.test(pageXml) || /<v:imagedata/.test(pageXml))) {
                  isColor = true; // Assume pages with images have color to be safe
                }
                
                if (isColor) {
                  colorPages++;
                  colorPageList.push(pageNum);
                } else {
                  bwPages++;
                  bwPageList.push(pageNum);
                }
              });
              
              // Adjust total if split didn't catch everything
              pageCount = Math.max(pageCount, colorPages + bwPages);
              
              // If pageCount is larger than we found color for, fill the rest as B&W
              if (pageCount > colorPages + bwPages) {
                  const extra = pageCount - (colorPages + bwPages);
                  const lastPageNum = colorPages + bwPages;
                  bwPages += extra;
                  for (let j = 1; j <= extra; j++) {
                      bwPageList.push(lastPageNum + j);
                  }
              }
            } else {
                pageCount = estimatedPages;
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
            const slideFiles = Object.keys(zip.files).filter(name => name.match(/^ppt\\/slides\\/slide\\d+\\.xml$/));
            
            if (slideFiles.length > 0) {
              pageCount = slideFiles.length;
            } else {
                const appXml = zip.file('docProps/app.xml');
                if (appXml) {
                  const appContent = await appXml.async('string');
                  const slidesMatch = appContent.match(/<Slides>(\\d+)<\\/Slides>/i);
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
              const numA = parseInt(a.replace(/[^\\d]/g, ''), 10);
              const numB = parseInt(b.replace(/[^\\d]/g, ''), 10);
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
              const sheetFiles = Object.keys(zip.files).filter(name => name.match(/^xl\\/worksheets\\/sheet\\d+\\.xml$/));
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
              const lines = textContent.split('\\n').length;
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
          url: \`/uploads/\${f.filename || 'mem'}\`
        };
      }));

      res.status(200).json({ success: true, files: uploadedFiles });
    } catch (err) {
      console.error('File parsing error:', err);
      res.status(500).json({ error: 'Error analyzing documents.' });
    }
  });
});`;

code = code.substring(0, startIndex) + replacementCode + code.substring(endIndex);

fs.writeFileSync('server.ts', code);
console.log("Successfully patched server.ts with DOCX/PPTX/Image support");
