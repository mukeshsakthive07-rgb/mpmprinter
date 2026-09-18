const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');

const updatedLogic = `
        try {
          // Parallelize Firestore getDoc and Admin API verify to cut wait times
          const tokenPromise = fUser.getIdToken();
          const userSnapPromise = getDoc(userRef);

          const [userSnap, token] = await Promise.all([userSnapPromise, tokenPromise]);
          
          let isAdmin = false;
          try {
            const res = await fetch('/api/admin/verify', {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            if (res.ok) {
              const data = await res.json();
              isAdmin = data.isAdmin === true;
            }
          } catch (e) {
            console.error("Failed to verify admin status");
          }
`;

code = code.replace(/        try \{\n          const userSnap = await getDoc\(userRef\);\n          \n          let isAdmin = false;\n          try \{\n            const token = await fUser\.getIdToken\(\);\n            const res = await fetch\('\/api\/admin\/verify', \{\n              headers: \{ 'Authorization': `Bearer \$\{token\}` \}\n            \}\);[\s\S]*?console\.error\("Failed to verify admin status"\);\n          \}/, updatedLogic.trim());

fs.writeFileSync('src/context/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx');
