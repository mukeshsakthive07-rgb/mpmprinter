const fs = require('fs');

let code = fs.readFileSync('src/components/StarryGlowBackground.tsx', 'utf-8');

code = code.replace(/const STAR_COUNT = isMobile \? 35 : 70;/, "const STAR_COUNT = isMobile ? 25 : 50;");
code = code.replace(/const METEOR_COUNT = isMobile \? 8 : 16;/, "const METEOR_COUNT = isMobile ? 5 : 10;");

code = code.replace(/<div className="fixed inset-0 pointer-events-none bg-\[#050814\] overflow-hidden" style={{ zIndex: 0 }}>/, 
`<div className="fixed inset-0 pointer-events-none bg-[#050814] overflow-hidden" style={{ zIndex: 0, contain: 'strict' }}>`);

code = code.replace(/<canvas ref={canvasRef} className="absolute inset-0 w-full h-full" \/>/,
`<canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: 'transform' }} />`);

fs.writeFileSync('src/components/StarryGlowBackground.tsx', code);
console.log("Patched StarryGlowBackground.tsx");
