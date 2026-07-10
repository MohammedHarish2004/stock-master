import { query, get, run } from '../database/db.js';
import { io } from '../server.js';

export const getSales = async (req, res) => {
  try {
    const { customer, jobNo, product } = req.query;
    
    let baseQuery = `
      SELECT s.*, GROUP_CONCAT(si.productName) as productNames 
      FROM sales s 
      LEFT JOIN sale_items si ON s.id = si.saleId 
    `;
    
    let whereClauses = [];
    let params = [];
    
    if (customer) {
      whereClauses.push(`(s.customerName LIKE ? OR s.phone LIKE ?)`);
      params.push(`%${customer}%`, `%${customer}%`);
    }
    
    if (jobNo) {
      whereClauses.push(`s.jobNo LIKE ?`);
      params.push(`%${jobNo}%`);
    }
    
    if (product) {
      whereClauses.push(`s.id IN (SELECT saleId FROM sale_items WHERE productName LIKE ?)`);
      params.push(`%${product}%`);
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
    
    const items = await query('SELECT * FROM sale_items WHERE saleId = ?', [sale.id]);
    sale.items = items;
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale' });
  }
};

export const createSale = async (req, res) => {
  try {
    const { customerName, phone, deliveryDate, jobNo, items, grandTotal } = req.body;
    
    // Generate Invoice Number
    const lastSale = await get('SELECT invoiceNo FROM sales ORDER BY id DESC LIMIT 1');
    let nextInvoiceNum = 1;
    if (lastSale && lastSale.invoiceNo) {
      const match = lastSale.invoiceNo.match(/\d+$/);
      if (match) {
        nextInvoiceNum = parseInt(match[0]) + 1;
      }
    }
    const invoiceNo = `INV${nextInvoiceNum.toString().padStart(4, '0')}`;

    // Start transaction
    await run('BEGIN TRANSACTION');
    
    // 1. Insert Sale
    const saleResult = await run(`INSERT INTO sales (invoiceNo, jobNo, customerName, phone, deliveryDate, grandTotal) 
      VALUES (?, ?, ?, ?, ?, ?)`, 
      [invoiceNo, jobNo, customerName, phone, deliveryDate, grandTotal]
    );
    const saleId = saleResult.lastID;

    // 2. Insert Sale Items and Reduce Stock
    for (let item of items) {
      await run(`INSERT INTO sale_items (saleId, productId, productName, salePrice, qty, total) 
        VALUES (?, ?, ?, ?, ?, ?)`, 
        [saleId, item.productId, item.productName, item.salePrice, item.qty, item.total]
      );
      
      await run(`UPDATE products SET stockQty = stockQty - ? WHERE id = ?`, [item.qty, item.productId]);
    }

    await run('COMMIT');
    io.emit('sale-updated');
    io.emit('product-updated');
    res.status(201).json({ message: 'Sale created successfully', invoiceNo });
  } catch (error) {
    await run('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error creating sale' });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    await run('BEGIN TRANSACTION');
    
    // Get sale items to restore stock
    const items = await query('SELECT * FROM sale_items WHERE saleId = ?', [saleId]);
    for (let item of items) {
      await run(`UPDATE products SET stockQty = stockQty + ? WHERE id = ?`, [item.qty, item.productId]);
    }
    // Delete sale items
    await run('DELETE FROM sale_items WHERE saleId = ?', [saleId]);
    // Delete sale
    await run('DELETE FROM sales WHERE id = ?', [saleId]);
    
    await run('COMMIT');
    io.emit('sale-updated');
    io.emit('product-updated');
    res.json({ message: 'Sale deleted and stock restored successfully' });
  } catch (error) {
    await run('ROLLBACK');
    res.status(500).json({ message: 'Error deleting sale' });
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

    res.json({
      totalProducts: totalProducts.count || 0,
      totalCategory: totalCategory.count || 0,
      todaySales: todaySales.total || 0,
      pendingDeliveries: pendingDeliveries.count || 0,
      lowStockProducts,
      latestSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
