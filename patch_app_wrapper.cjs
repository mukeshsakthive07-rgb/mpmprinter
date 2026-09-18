const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldApp = `export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <StarryGlowBackground />
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}`;

const newApp = `export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <StarryGlowBackground />
        <div className="relative z-10 bg-transparent min-h-screen w-full">
          <MainContent />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}`;

code = code.replace(oldApp, newApp);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx wrapper");
