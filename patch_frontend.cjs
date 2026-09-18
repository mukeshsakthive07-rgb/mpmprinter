const fs = require('fs');

let code = fs.readFileSync('src/components/PrinterOrderPage.tsx', 'utf-8');

code = code.replace(
  /colorPageList: f\.colorPageList,\n\s*printType: f\.printType,\n\s*url: f\.url,/g,
  "colorPageList: f.colorPageList,\n                printType: f.printType,\n                printMode: f.printMode || 'hybrid',\n                url: f.url,"
);

fs.writeFileSync('src/components/PrinterOrderPage.tsx', code);
console.log("Patched frontend mapping");
