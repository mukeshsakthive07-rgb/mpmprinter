const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

// Replace the root div classes
const oldDiv = `<div className="min-h-[100dvh] bg-[#060913] flex flex-col justify-center py-12 relative overflow-hidden">
      {/* Gemini 3 Swirling Wave Particle Background */}
      <GeminiParticleBackground />`;

const newDiv = `<div className="min-h-[100dvh] bg-transparent flex flex-col justify-center py-12 relative overflow-hidden">`;

code = code.replace(oldDiv, newDiv);
fs.writeFileSync('src/components/LoginPage.tsx', code);
console.log("Patched LoginPage background");
