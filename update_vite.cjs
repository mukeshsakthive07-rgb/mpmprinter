const fs = require('fs');
let config = fs.readFileSync('vite.config.ts', 'utf-8');

const updatedChunks = `
        manualChunks: {
          reactVendor: ['react', 'react-dom'],
          firebaseVendor: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          icons: ['lucide-react'],
          pdfLib: ['pdf-lib'],
          framerMotion: ['framer-motion']
        }
`;

config = config.replace(/manualChunks: \{[\s\S]*?\}/, updatedChunks.trim());
fs.writeFileSync('vite.config.ts', config);
console.log('Updated vite.config.ts');
