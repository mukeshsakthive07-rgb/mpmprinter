const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

code = code.replace(`import { GeminiParticleBackground } from './GeminiParticleBackground';\n`, '');
fs.writeFileSync('src/components/LoginPage.tsx', code);
console.log("Patched LoginPage import");
