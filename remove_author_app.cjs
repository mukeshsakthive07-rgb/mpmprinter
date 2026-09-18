const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  /<span className="text-\[13px\] font-medium text-slate-400 tracking-wide uppercase mt-1">\s*By Mugilan & Mukesh\s*<\/span>/g,
  ''
);
code = code.replace(
  'By Mugilan &amp; Mukesh • ',
  ''
);
fs.writeFileSync('src/App.tsx', code);
