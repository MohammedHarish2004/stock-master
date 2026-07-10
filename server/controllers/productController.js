import { query, get, run } from '../database/db.js';
import { io } from '../server.js';

export const getProducts = async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY id DESC');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { productName, category, brand, costPrice, defaultSellingPrice, stockQty } = req.body;
    
    // Check if exact same product (same name AND same category) exists
    const existing = await get(
      'SELECT * FROM products WHERE productName = ? AND category = ?',
      [productName, category]
    );
    
    if (existing) {
      // Same name + same category → add stock
      const newStock = parseInt(existing.stockQty) + parseInt(stockQty);
      await run(`UPDATE products SET 
        stockQty = ?, 
        brand = ?, 
        costPrice = ?, 
        defaultSellingPrice = ?, 
        updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?`, 
        [newStock, brand, costPrice, defaultSellingPrice, existing.id]
      );
      io.emit('product-updated');
      res.json({ message: `Stock added to existing product. New qty: ${newStock}`, type: 'update' });
    } else {
      // Different name OR different category → create new product
      await run(`INSERT INTO products (productName, category, brand, costPrice, defaultSellingPrice, stockQty) 
        VALUES (?, ?, ?, ?, ?, ?)`, 
        [productName, category, brand, costPrice, defaultSellingPrice, stockQty]
      );
      io.emit('product-updated');
      res.status(201).json({ message: 'New product created successfully', type: 'create' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productName, category, brand, costPrice, defaultSellingPrice, stockQty } = req.body;
    await run(`UPDATE products SET 
      productName = ?, category = ?, brand = ?, costPrice = ?, defaultSellingPrice = ?, stockQty = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?`, 
      [productName, category, brand, costPrice, defaultSellingPrice, stockQty, req.params.id]
    );
    io.emit('product-updated');
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    io.emit('product-updated');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};

export const getProductSales = async (req, res) => {
  try {
    const sales = await query(`
      SELECT s.invoiceNo, s.jobNo, s.saleDate, s.customerName, si.qty, si.salePrice, si.total
      FROM sale_items si
      JOIN sales s ON si.saleId = s.id
      WHERE si.productId = ?
      ORDER BY s.saleDate DESC
    `, [req.params.id]);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product sales' });
  }
};
