const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// A function to inject Cache-Control: no-transform into all res.json() calls
// Actually, it's safer to just inject it manually or create a middleware.
const middleware = `
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-transform');
  next();
});
`;

code = code.replace("app.use(compression());", "app.use(compression());\n" + middleware);
fs.writeFileSync('server.ts', code);
console.log('Patched Cache-Control');
