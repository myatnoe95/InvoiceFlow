import { Router } from 'express';
import pool from '../db/connection.js';
import { getNextInvoiceNumber } from '../utils/invoiceNumber.js';

const router = Router();

// GET /api/invoices/next-number/:shopId
router.get('/next-number/:shopId', async (req, res) => {
  try {
    const number = await getNextInvoiceNumber(Number(req.params.shopId));
    res.json({ invoice_number: number });
  } catch {
    res.status(404).json({ error: 'Shop not found' });
  }
});

// GET /api/invoices
router.get('/', async (req, res) => {
  const { shop_id, status, search, page = '1', limit = '20' } = req.query;
  let sql = `
    SELECT i.*, s.name as shop_name, s.prefix as shop_prefix
    FROM invoices i
    JOIN shops s ON i.shop_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (shop_id) {
    sql += ` AND i.shop_id = $${paramIndex++}`;
    params.push(shop_id);
  }
  if (status && status !== 'all') {
    sql += ` AND i.status = $${paramIndex++}`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (i.customer_name ILIKE $${paramIndex} OR i.invoice_number ILIKE $${paramIndex + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
  }

  const countSql = sql.replace('SELECT i.*, s.name as shop_name, s.prefix as shop_prefix', 'SELECT COUNT(*) as total');
  const countResult = await pool.query(countSql, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const offset = (Number(page) - 1) * Number(limit);
  sql += ` ORDER BY i.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(Number(limit), offset);

  const result = await pool.query(sql, params);
  res.json({ invoices: result.rows, total, page: Number(page), limit: Number(limit) });
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  const invoiceResult = await pool.query(`
    SELECT i.*, s.name as shop_name, s.prefix as shop_prefix, s.address as shop_address,
           s.phone as shop_phone, s.email as shop_email, s.logo_url as shop_logo
    FROM invoices i
    JOIN shops s ON i.shop_id = s.id
    WHERE i.id = $1
  `, [req.params.id]);

  if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
  const invoice = invoiceResult.rows[0];

  const items = await pool.query(
    'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [req.params.id]
  );

  const payments = await pool.query(
    'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at DESC', [req.params.id]
  );

  const totalPaidResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = $1', [req.params.id]
  );
  const totalPaid = parseFloat(totalPaidResult.rows[0].total);

  res.json({ ...invoice, items: items.rows, payments: payments.rows, total_paid: totalPaid, remaining: invoice.total - totalPaid });
});

// POST /api/invoices
router.post('/', async (req, res) => {
  const {
    shop_id, customer_name, customer_email, customer_phone, customer_address,
    issue_date, due_date, tax_rate, discount_type, discount_value,
    delivery_fees, notes, payment_terms, status, items
  } = req.body;

  if (!shop_id || !customer_name || !issue_date || !items?.length) {
    return res.status(400).json({ error: 'Shop, customer name, issue date, and at least one item are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invoice_number = await getNextInvoiceNumber(shop_id);

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0);
    const taxRate = tax_rate || 0;
    const tax_amount = subtotal * (taxRate / 100);

    let discount_amount = 0;
    if (discount_type === 'percentage') {
      discount_amount = subtotal * ((discount_value || 0) / 100);
    } else if (discount_type === 'fixed') {
      discount_amount = discount_value || 0;
    }

    const deliveryFees = delivery_fees || 0;
    const total = subtotal + tax_amount - discount_amount + deliveryFees;

    const invoiceResult = await client.query(`
      INSERT INTO invoices (shop_id, invoice_number, customer_name, customer_email, customer_phone,
        customer_address, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_type,
        discount_value, discount_amount, delivery_fees, total, notes, payment_terms, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `, [
      shop_id, invoice_number, customer_name, customer_email || null, customer_phone || null,
      customer_address || null, issue_date, due_date || null, subtotal, taxRate, tax_amount,
      discount_type || 'none', discount_value || 0, discount_amount, deliveryFees, total,
      notes || null, payment_terms || null, status || 'draft'
    ]);

    const invoiceId = invoiceResult.rows[0].id;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await client.query(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price, index]);
    }

    await client.query('COMMIT');

    const invoice = await pool.query(`
      SELECT i.*, s.name as shop_name, s.prefix as shop_prefix
      FROM invoices i JOIN shops s ON i.shop_id = s.id WHERE i.id = $1
    `, [invoiceId]);
    const invoiceItems = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [invoiceId]);
    res.status(201).json({ ...invoice.rows[0], items: invoiceItems.rows });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  const {
    customer_name, customer_email, customer_phone, customer_address,
    issue_date, due_date, tax_rate, discount_type, discount_value,
    delivery_fees, notes, payment_terms, status, items
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0);
    const taxRate = tax_rate || 0;
    const tax_amount = subtotal * (taxRate / 100);

    let discount_amount = 0;
    if (discount_type === 'percentage') {
      discount_amount = subtotal * ((discount_value || 0) / 100);
    } else if (discount_type === 'fixed') {
      discount_amount = discount_value || 0;
    }

    const deliveryFees = delivery_fees || 0;
    const total = subtotal + tax_amount - discount_amount + deliveryFees;

    const result = await client.query(`
      UPDATE invoices SET customer_name = $1, customer_email = $2, customer_phone = $3,
        customer_address = $4, issue_date = $5, due_date = $6, subtotal = $7, tax_rate = $8,
        tax_amount = $9, discount_type = $10, discount_value = $11, discount_amount = $12,
        delivery_fees = $13, total = $14, notes = $15, payment_terms = $16, status = $17, updated_at = NOW()
      WHERE id = $18
    `, [
      customer_name, customer_email || null, customer_phone || null,
      customer_address || null, issue_date, due_date || null, subtotal, taxRate, tax_amount,
      discount_type || 'none', discount_value || 0, discount_amount, deliveryFees, total,
      notes || null, payment_terms || null, status || 'draft', req.params.id
    ]);

    if (result.rowCount === 0) throw new Error('Invoice not found');

    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await client.query(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [req.params.id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price, index]);
    }

    await client.query('COMMIT');

    const invoice = await pool.query(`
      SELECT i.*, s.name as shop_name, s.prefix as shop_prefix
      FROM invoices i JOIN shops s ON i.shop_id = s.id WHERE i.id = $1
    `, [req.params.id]);
    const invoiceItems = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [req.params.id]);
    res.json({ ...invoice.rows[0], items: invoiceItems.rows });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(err.message === 'Invoice not found' ? 404 : 400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

// ========== PAYMENTS ==========

// GET /api/invoices/:invoiceId/payments
router.get('/:invoiceId/payments', async (req, res) => {
  const payments = await pool.query(
    'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at DESC', [req.params.invoiceId]
  );

  const totalPaidResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = $1', [req.params.invoiceId]
  );
  const totalPaid = parseFloat(totalPaidResult.rows[0].total);

  const invoice = await pool.query('SELECT total FROM invoices WHERE id = $1', [req.params.invoiceId]);

  res.json({
    payments: payments.rows,
    total_paid: totalPaid,
    remaining: invoice.rows[0] ? invoice.rows[0].total - totalPaid : 0,
  });
});

// POST /api/invoices/:invoiceId/payments
router.post('/:invoiceId/payments', async (req, res) => {
  const { method, amount, note, paid_at } = req.body;

  if (!method || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Payment method and a positive amount are required' });
  }

  const invoiceResult = await pool.query('SELECT id, total FROM invoices WHERE id = $1', [req.params.invoiceId]);
  if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
  const invoice = invoiceResult.rows[0];

  const result = await pool.query(
    'INSERT INTO payments (invoice_id, method, amount, note, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [req.params.invoiceId, method, amount, note || null, paid_at || new Date().toISOString()]
  );

  // Auto-update invoice status based on payments
  const totalPaidResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = $1', [req.params.invoiceId]
  );
  const totalPaid = parseFloat(totalPaidResult.rows[0].total);

  if (totalPaid >= invoice.total) {
    await pool.query("UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE id = $1", [req.params.invoiceId]);
  } else if (totalPaid > 0) {
    await pool.query("UPDATE invoices SET status = 'partial', updated_at = NOW() WHERE id = $1", [req.params.invoiceId]);
  }

  res.status(201).json(result.rows[0]);
});

// DELETE /api/invoices/:invoiceId/payments/:paymentId
router.delete('/:invoiceId/payments/:paymentId', async (req, res) => {
  const result = await pool.query(
    'DELETE FROM payments WHERE id = $1 AND invoice_id = $2', [req.params.paymentId, req.params.invoiceId]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found' });

  // Re-check status after deletion
  const invoice = await pool.query('SELECT total FROM invoices WHERE id = $1', [req.params.invoiceId]);
  const totalPaidResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = $1', [req.params.invoiceId]
  );
  const totalPaid = parseFloat(totalPaidResult.rows[0].total);

  if (totalPaid >= invoice.rows[0].total) {
    await pool.query("UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE id = $1", [req.params.invoiceId]);
  } else if (totalPaid > 0) {
    await pool.query("UPDATE invoices SET status = 'partial', updated_at = NOW() WHERE id = $1", [req.params.invoiceId]);
  } else {
    await pool.query("UPDATE invoices SET status = 'draft', updated_at = NOW() WHERE id = $1", [req.params.invoiceId]);
  }

  res.json({ success: true });
});

export default router;
