import { Router } from 'express';
import pool from '../db/connection.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (_req, res) => {
  const shopCount = (await pool.query('SELECT COUNT(*) as count FROM shops')).rows[0].count;
  const invoiceCount = (await pool.query('SELECT COUNT(*) as count FROM invoices')).rows[0].count;

  const statusCounts = (await pool.query(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
    FROM invoices GROUP BY status
  `)).rows;

  const totalRevenue = (await pool.query(
    "SELECT COALESCE(SUM(total - COALESCE(delivery_fees, 0)), 0) as total FROM invoices WHERE status = $1", ['paid']
  )).rows[0].total;

  const recentInvoices = (await pool.query(`
    SELECT i.*, s.name as shop_name, s.prefix as shop_prefix
    FROM invoices i
    JOIN shops s ON i.shop_id = s.id
    ORDER BY i.created_at DESC
    LIMIT 10
  `)).rows;

  res.json({
    shop_count: parseInt(shopCount, 10),
    invoice_count: parseInt(invoiceCount, 10),
    status_counts: statusCounts,
    total_revenue: parseFloat(totalRevenue),
    recent_invoices: recentInvoices,
  });
});

export default router;
