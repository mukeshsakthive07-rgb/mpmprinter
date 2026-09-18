const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const oldLogoHTML = `<div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <img src="/logo.png" alt="MPM Printer Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>`;

const newLogoHTML = `<div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
            <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>`;

code = code.replace(oldLogoHTML, newLogoHTML);
fs.writeFileSync('src/components/LoginPage.tsx', code);
console.log("Patched LoginPage");
