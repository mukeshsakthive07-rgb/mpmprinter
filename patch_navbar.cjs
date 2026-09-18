const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

const oldLogoHTML = `<div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('order')}>
          {/* Vector Icon */}
          <img 
            src="/logo.svg" 
            alt="MPM PRINTER Logo" 
            className="w-12 h-12 object-contain drop-shadow-md" 
          />
          
          {/* Matching Tailwind Gradient Typography */}
          <span className="font-fredoka text-xl font-bold tracking-tight bg-gradient-to-b from-[#00f0ff] to-[#00e676] bg-clip-text text-transparent">
            MPM PRINTER
          </span>
        </div>`;

const newLogoHTML = `<div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('order')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-fredoka text-lg font-bold tracking-tight text-white leading-tight">
              MPM PRINTER
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              By Mugilan & Mukesh
            </span>
          </div>
        </div>`;

code = code.replace(oldLogoHTML, newLogoHTML);
fs.writeFileSync('src/components/Navbar.tsx', code);
console.log("Patched Navbar");
