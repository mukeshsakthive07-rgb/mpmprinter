const fs = require('fs');
let code = fs.readFileSync('src/components/PrinterOrderPage.tsx', 'utf-8');

const targetRegex = /\{file\.colorPages !== undefined && file\.bwPages !== undefined && srvId === 'colour' && \([\s\S]*?className=\{`py-2 px-3 rounded-xl border text-center font-bold transition-all \$\{[\s\S]*?file\.printMode === 'all-color'[\s\S]*?\?'border-cyan-400 bg-cyan-500\/20 text-cyan-300'[\s\S]*?: 'border-white\/10 text-slate-400 hover:text-white'[\s\S]*?\}`\}[\s\S]*?>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/m;

const replacement = `{file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour' && (
  <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/30 text-white space-y-4">
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300">
          டாக்குமெண்ட் பக்கங்களின் விவரம் (Page Analysis)
        </h4>
      </div>
      <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-200">
        மொத்த பக்கங்கள்: {file.pageCount}
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-emerald-400">
            🌈 கலர் பக்கங்கள் ({file.colorPages})
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold">
            ₹6.80 / பக்கம்
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {file.colorPageList && file.colorPageList.length > 0 ? (
            file.colorPageList.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                Page {p}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">கலர் பக்கங்கள் இல்லை</span>
          )}
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">
            📄 Black & White பக்கங்கள் ({file.bwPages})
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            ₹1.00 / பக்கம்
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {file.bwPageList && file.bwPageList.length > 0 ? (
            file.bwPageList.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-300 font-mono text-[11px] font-bold border border-slate-600/50">
                Page {p}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">B&W பக்கங்கள் இல்லை</span>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
      <button
        type="button"
        onClick={() => {
          const updated = [...uploadedFiles];
          updated[idx].printMode = 'hybrid';
          setUploadedFiles(updated);
        }}
        className={\`py-2 px-3 rounded-xl border text-center font-bold transition-all \${
          (file.printMode || 'hybrid') === 'hybrid'
            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
            : 'border-white/10 text-slate-400 hover:text-white'
        }\`}
      >
        ✨ Smart Hybrid (பணம் மிச்சமாகும்)
      </button>

      <button
        type="button"
        onClick={() => {
          const updated = [...uploadedFiles];
          updated[idx].printMode = 'all-color';
          setUploadedFiles(updated);
        }}
        className={\`py-2 px-3 rounded-xl border text-center font-bold transition-all \${
          file.printMode === 'all-color'
            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
            : 'border-white/10 text-slate-400 hover:text-white'
        }\`}
      >
        அனைத்துப் பக்கங்களும் கலர்
      </button>
    </div>
  </div>
)}`;

code = code.replace(targetRegex, replacement);

fs.writeFileSync('src/components/PrinterOrderPage.tsx', code);
console.log('UI Patched');
