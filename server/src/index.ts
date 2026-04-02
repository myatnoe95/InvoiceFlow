import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './db/migrate.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import shopsRouter from './routes/shops.js';
import invoicesRouter from './routes/invoices.js';
import dashboardRouter from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/shops', requireAuth, shopsRouter);
app.use('/api/invoices', requireAuth, invoicesRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

// Run migrations then start server
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
