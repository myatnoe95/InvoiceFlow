import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

export async function migrate() {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);

  // Add columns if they don't exist (for existing databases)
  const shopCols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'shops'
  `);
  const shopColNames = shopCols.rows.map((r: any) => r.column_name);
  if (!shopColNames.includes('logo_url')) {
    await pool.query('ALTER TABLE shops ADD COLUMN logo_url TEXT');
  }

  const invCols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'invoices'
  `);
  const invColNames = invCols.rows.map((r: any) => r.column_name);
  if (!invColNames.includes('delivery_fees')) {
    await pool.query('ALTER TABLE invoices ADD COLUMN delivery_fees DOUBLE PRECISION DEFAULT 0');
  }

  console.log('Database migrated successfully');
}
