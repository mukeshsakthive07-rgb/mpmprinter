const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4"', 
  'className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4"'
);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx loading state");
