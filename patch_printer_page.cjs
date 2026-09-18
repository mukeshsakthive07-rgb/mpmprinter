const fs = require('fs');
let code = fs.readFileSync('src/components/PrinterOrderPage.tsx', 'utf-8');

const optimisticLogic = `
    const optimisticFiles = await Promise.all(validFiles.map(async (file) => {
      let pageCount = 1;
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'pdf') {
        try {
          const arrayBuffer = await file.slice(0, 1024 * 100).arrayBuffer(); // Read first 100kb for speed
          const text = new TextDecoder().decode(arrayBuffer);
          const match = text.match(/\\/Count\\s+(\\d+)/);
          if (match && match[1]) {
            pageCount = parseInt(match[1], 10);
          } else {
             const allText = new TextDecoder().decode(await file.arrayBuffer());
             const pageMatches = allText.match(/\\/Type\\s*\\/Page[^s]/g);
             if (pageMatches) pageCount = pageMatches.length;
          }
        } catch(e) {}
      }

      return {
        id: "temp-" + Date.now() + "-" + file.name,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        pageCount: pageCount,
        bwPages: pageCount,
        colorPages: 0,
        colorPageList: [],
        printType: 'B&W',
        copies: 1,
        paperSize: 'A4',
        layout: 'Portrait',
        isAnalyzing: true
      };
    }));
    
    if (isMountedRef.current) {
      setUploadedFiles(prev => [...prev, ...optimisticFiles as any]);
    }

    try {
`;

code = code.replace(/    try \{\n      setUploadProgress\(0\);\n      showToast\('Uploading files\.\.\.', 'info'\);/, optimisticLogic + "      setUploadProgress(0);\n      showToast('Uploading files...', 'info');");

fs.writeFileSync('src/components/PrinterOrderPage.tsx', code);
console.log('Patched PrinterOrderPage.tsx');
