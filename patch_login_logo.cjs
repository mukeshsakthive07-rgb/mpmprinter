const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const oldLogo = `<div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
            <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <h1 className="font-fredoka text-3xl font-extrabold text-white tracking-tight">
            MPM PRINTER
          </h1>
          <p className="mt-2 text-xs text-slate-400 max-w-xs mx-auto">
            High-speed document printing, spiral binding, colour photocopies &amp; campus delivery.
          </p>
        </div>`;

const newLogo = `<div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-5 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <svg className="w-12 h-12 text-cyan-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <h1 className="font-fredoka text-4xl font-extrabold text-white tracking-tight leading-none bg-gradient-to-b from-[#00f0ff] to-[#00e676] bg-clip-text text-transparent">
              MPM PRINTER
            </h1>
            <span className="text-[13px] font-medium text-slate-400 tracking-wide uppercase mt-1">
              By Mugilan & Mukesh
            </span>
          </div>
          <p className="mt-4 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            High-speed document printing, spiral binding, colour photocopies &amp; campus delivery.
          </p>
        </div>`;

code = code.replace(oldLogo, newLogo);
fs.writeFileSync('src/components/LoginPage.tsx', code);
console.log("Patched LoginPage logo");
