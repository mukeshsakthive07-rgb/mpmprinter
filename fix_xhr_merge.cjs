const fs = require('fs');
let code = fs.readFileSync('src/components/PrinterOrderPage.tsx', 'utf-8');

const updatedOnLoad = `
      xhr.onload = () => {
        if (!isMountedRef.current) return;
        setIsSubmitting(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.files) {
              const newDocs = data.files.map((f: any) => ({
                id: f.id || \`doc-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
                name: f.name,
                size: f.size,
                type: f.type,
                pageCount: f.pageCount,
                bwPages: f.bwPages,
                colorPages: f.colorPages,
                colorPageList: f.colorPageList,
                printType: f.printType,
                url: f.url,
                isAnalyzing: false
              }));
              setUploadedFiles((prev) => {
                // Filter out the optimistic ones that share names/sizes
                const filtered = prev.filter(p => !p.isAnalyzing);
                return [...filtered, ...newDocs];
              });
              showToast('Files uploaded successfully', 'success');
`;

code = code.replace(/      xhr\.onload = \(\) => \{[\s\S]*?showToast\('Files uploaded successfully', 'success'\);/, updatedOnLoad);
fs.writeFileSync('src/components/PrinterOrderPage.tsx', code);
console.log('Fixed XHR merge');
