const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// Add import compression
if (!code.includes("import compression")) {
    code = code.replace(/import express/, "import compression from 'compression';\nimport express");
}

// Add app.use(compression()) right after const app = express();
if (!code.includes("app.use(compression())")) {
    code = code.replace(/const app = express\(\);/, "const app = express();\napp.use(compression());");
}

// Cache for rates
const rateLogicOld = `app.get('/api/rates', (req, res) => {
  res.json({ rates: db.getPrintRates() });
});`;

const rateLogicNew = `
let cachedRates = null;
let cachedRatesTime = 0;
app.get('/api/rates', (req, res) => {
  if (Date.now() - cachedRatesTime < 60000 && cachedRates) {
    return res.json({ rates: cachedRates });
  }
  try {
    cachedRates = db.getPrintRates();
    cachedRatesTime = Date.now();
    res.json({ rates: cachedRates });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});
`;

code = code.replace(rateLogicOld, rateLogicNew);

// Invalidate cache on admin rate update
const adminUpdateOld = `db.updatePrintRates(req.body.rates);
  res.json({ success: true, rates: db.getPrintRates() });`;

const adminUpdateNew = `db.updatePrintRates(req.body.rates);
  cachedRates = null; // Invalidate cache
  res.json({ success: true, rates: db.getPrintRates() });`;

code = code.replace(adminUpdateOld, adminUpdateNew);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with compression and cache");
