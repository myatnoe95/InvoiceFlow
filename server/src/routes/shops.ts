import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// GET /api/shops
router.get('/', async (_req, res) => {
  const result = await pool.query(`
    SELECT s.*, COUNT(i.id) as invoice_count
    FROM shops s
    LEFT JOIN invoices i ON s.id = i.shop_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
  res.json(result.rows);
});

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, COUNT(i.id) as invoice_count
    FROM shops s
    LEFT JOIN invoices i ON s.id = i.shop_id
    WHERE s.id = $1
    GROUP BY s.id
  `, [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
  res.json(result.rows[0]);
});

// POST /api/shops
router.post('/', upload.single('logo'), async (req, res) => {
  const { name, address, phone, email, prefix } = req.body;
  if (!name || !prefix) {
    return res.status(400).json({ error: 'Name and prefix are required' });
  }
  const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      'INSERT INTO shops (name, address, phone, email, prefix, logo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, address || null, phone || null, email || null, prefix.toUpperCase(), logo_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Prefix already exists' });
    }
    throw err;
  }
});

// PUT /api/shops/:id
router.put('/:id', upload.single('logo'), async (req, res) => {
  const { name, address, phone, email, prefix } = req.body;
  if (!name || !prefix) {
    return res.status(400).json({ error: 'Name and prefix are required' });
  }

  let logo_url: string | null | undefined;
  if (req.file) {
    logo_url = `/uploads/${req.file.filename}`;
    // Delete old logo file
    const oldShop = await pool.query('SELECT logo_url FROM shops WHERE id = $1', [req.params.id]);
    if (oldShop.rows[0]?.logo_url) {
      const oldPath = path.join(__dirname, '../..', oldShop.rows[0].logo_url);
      fs.unlink(oldPath, () => {});
    }
  }

  try {
    let result;
    if (logo_url !== undefined) {
      result = await pool.query(
        `UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, prefix = $5, logo_url = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
        [name, address || null, phone || null, email || null, prefix.toUpperCase(), logo_url, req.params.id]
      );
    } else {
      result = await pool.query(
        `UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, prefix = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
        [name, address || null, phone || null, email || null, prefix.toUpperCase(), req.params.id]
      );
    }
    if (result.rowCount === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Prefix already exists' });
    }
    throw err;
  }
});

// DELETE /api/shops/:id
router.delete('/:id', async (req, res) => {
  // Delete logo file
  const shop = await pool.query('SELECT logo_url FROM shops WHERE id = $1', [req.params.id]);
  if (shop.rows[0]?.logo_url) {
    const logoPath = path.join(__dirname, '../..', shop.rows[0].logo_url);
    fs.unlink(logoPath, () => {});
  }
  const result = await pool.query('DELETE FROM shops WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Shop not found' });
  res.json({ success: true });
});

export default router;
