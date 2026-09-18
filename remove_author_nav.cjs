const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
code = code.replace(
  /<span className="text-\[11px\] text-slate-400 leading-tight">\s*By Mugilan & Mukesh\s*<\/span>/g,
  ''
);
fs.writeFileSync('src/components/Navbar.tsx', code);
