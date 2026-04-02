import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Static admin account
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'JasminePhoo0611';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email, name: 'Admin' } });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    res.json({ user: { email: decoded.email, name: 'Admin' } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
