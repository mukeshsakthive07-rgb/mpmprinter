const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');
code = code.replace(
  /<span className="text-\[13px\] font-medium text-slate-400 tracking-wide uppercase mt-1">\s*By Mugilan & Mukesh\s*<\/span>/g,
  ''
);
fs.writeFileSync('src/components/LoginPage.tsx', code);
