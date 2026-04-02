import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

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
