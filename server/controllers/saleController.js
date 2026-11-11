import { query, get, run } from '../database/db.js';
import { io } from '../server.js';

// ────────────────────────────────────────────────────────────────────
// ALL reads/writes go to SQLite (local-first).
// ────────────────────────────────────────────────────────────────────

export const getSales = async (req, res) => {
  try {
    const { customer, invoiceNo, product, barcode } = req.query;

    let baseQuery = `
      SELECT s.*, 
             GROUP_CONCAT(DISTINCT si.productName) as productNames,
             GROUP_CONCAT(DISTINCT p.barcode) as barcodes
      FROM sales s 
      LEFT JOIN sale_items si ON s.id = si.saleId 
      LEFT JOIN products p ON si.productId = p.id
    `;

    let whereClauses = [];
    let params = [];

    if (customer) {
      whereClauses.push(`(s.customerName LIKE ? OR s.phone LIKE ?)`);
      params.push(`%${customer}%`, `%${customer}%`);
    }

    if (invoiceNo) {
      whereClauses.push(`s.invoiceNo LIKE ?`);
      params.push(`%${invoiceNo}%`);
    }

    if (product) {
      whereClauses.push(`s.id IN (SELECT saleId FROM sale_items WHERE productName LIKE ?)`);
      params.push(`%${product}%`);
    }

    if (barcode) {
      whereClauses.push(`s.id IN (
        SELECT si_sub.saleId 
        FROM sale_items si_sub 
        JOIN products p_sub ON si_sub.productId = p_sub.id 
        WHERE p_sub.barcode LIKE ?
      )`);
      params.push(`%${barcode}%`);
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    baseQuery += ` GROUP BY s.id ORDER BY s.id DESC`;

    const sales = await query(baseQuery, params);
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await get('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    const items = await query(`
      SELECT si.*, p.barcode 
      FROM sale_items si
      LEFT JOIN products p ON si.productId = p.id
      WHERE si.saleId = ?
    `, [sale.id]);
    sale.items = items;

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale' });
  }
};

export const createSale = async (req, res) => {
  try {
    const { jobNo, customerName, phone, deliveryDate, items, grandTotal } = req.body;

    if (typeof jobNo !== 'string' || !jobNo.trim()) {
      return res.status(400).json({ message: 'Job No. is required' });
    }

    // Generate Invoice Number
    const lastSale = await get('SELECT invoiceNo FROM sales ORDER BY id DESC LIMIT 1');
    let nextInvoiceNum = 1;
    if (lastSale && lastSale.invoiceNo) {
      const match = lastSale.invoiceNo.match(/\d+$/);
      if (match) {
        nextInvoiceNum = Number(match[0]) + 1;
      }
    }
    const invoiceNo = `INV${nextInvoiceNum.toString().padStart(4, '0')}`;

    // Always write to SQLite first
    await run('BEGIN TRANSACTION');
    const saleResult = await run(`INSERT INTO sales (invoiceNo, jobNo, customerName, phone, deliveryDate, grandTotal) VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceNo, jobNo.trim(), customerName, phone, deliveryDate, grandTotal]
    );
    const saleId = saleResult.lastID;
    for (const item of items) {
      // Lookup product costPrice at the moment of sale
      const product = await get('SELECT costPrice FROM products WHERE id = ?', [item.productId]);
      const currentCostPrice = product?.costPrice ?? (item.costPrice ?? 0);

      await run(`INSERT INTO sale_items (saleId, productId, productName, costPrice, salePrice, qty, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleId, item.productId, item.productName, currentCostPrice, item.salePrice, item.qty, item.total]
      );
      await run(`UPDATE products SET stockQty = stockQty - ? WHERE id = ?`, [item.qty, item.productId]);
    }
    await run('COMMIT');

    io.emit('sale-updated');
    io.emit('product-updated');
    return res.status(201).json({ message: 'Sale created', invoiceNo });
  } catch (error) {
    try { await run('ROLLBACK'); } catch (_) {}
    console.error(error);
    res.status(500).json({ message: 'Error creating sale' });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    await run('BEGIN TRANSACTION');
    const soldItems = await query(
      'SELECT productId, SUM(qty) AS qty FROM sale_items WHERE saleId = ? GROUP BY productId',
      [saleId]
    );
    for (const item of soldItems) {
      await run(
        'UPDATE products SET stockQty = COALESCE(stockQty, 0) + ? WHERE id = ?',
        [item.qty, item.productId]
      );
    }
    await run('DELETE FROM sale_items WHERE saleId = ?', [saleId]);
    await run('DELETE FROM sales WHERE id = ?', [saleId]);
    await run('COMMIT');

    io.emit('sale-updated');
    io.emit('product-updated');
    return res.json({ message: 'Sale deleted' });
  } catch (error) {
    try { await run('ROLLBACK'); } catch (_) {}
    console.error(error);
    return res.status(500).json({ message: 'Error deleting sale' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await get('SELECT COUNT(*) as count FROM products');
    const totalCategory = await get('SELECT COUNT(*) as count FROM categories');
    const todaySales = await get('SELECT SUM(grandTotal) as total FROM sales WHERE date(saleDate) = date("now")');
    const pendingDeliveries = await get('SELECT COUNT(*) as count FROM sales WHERE deliveryDate >= date("now") OR deliveryDate IS NULL');
    const lowStockProducts = await query('SELECT * FROM products WHERE stockQty <= 5 ORDER BY stockQty ASC LIMIT 10');
    const latestSales = await query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
    // New profit & loss calculations
    const revenueRow = await get('SELECT SUM(grandTotal) as revenue FROM sales');
    const cogsRow = await get(`SELECT SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as cogs
      FROM sale_items si
      LEFT JOIN products p ON si.productId = p.id`);
    const profit = (revenueRow.revenue || 0) - (cogsRow.cogs || 0);
    res.json({
      totalProducts: totalProducts.count || 0,
      totalCategory: totalCategory.count || 0,
      todaySales: todaySales.total || 0,
      pendingDeliveries: pendingDeliveries.count || 0,
      lowStockProducts,
      latestSales,
      revenue: revenueRow.revenue || 0,
      cogs: cogsRow.cogs || 0,
      profit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
