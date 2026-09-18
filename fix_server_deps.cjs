const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const deps = `
const sseClients: any[] = [];

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const user = db.validateToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;

code = code.replace("const app = express();", deps + "\nconst app = express();");
fs.writeFileSync('server.ts', code);
console.log('Fixed deps');
