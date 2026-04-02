import pool from '../db/connection.js';

export async function getNextInvoiceNumber(shopId: number): Promise<string> {
  const shopResult = await pool.query('SELECT prefix FROM shops WHERE id = $1', [shopId]);
  if (shopResult.rows.length === 0) throw new Error('Shop not found');
  const shop = shopResult.rows[0];

  const latestResult = await pool.query(
    'SELECT invoice_number FROM invoices WHERE shop_id = $1 ORDER BY id DESC LIMIT 1',
    [shopId]
  );

  let nextNum = 1;
  if (latestResult.rows.length > 0) {
    const parts = latestResult.rows[0].invoice_number.split('-');
    const currentNum = parseInt(parts[parts.length - 1], 10);
    nextNum = currentNum + 1;
  }

  return `${shop.prefix}-${String(nextNum).padStart(4, '0')}`;
}
