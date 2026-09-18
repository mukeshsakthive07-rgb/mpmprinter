const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace("const countMatch = str.match(//Type\\s*/Page[^s]/g);", "const countMatch = str.match(/\\/Type\\s*\\/Page[^s]/g);");
code = code.replace("const countAttr = str.match(//Count\\s+(\\d+)/);", "const countAttr = str.match(/\\/Count\\s+(\\d+)/);");

fs.writeFileSync('server.ts', code);
