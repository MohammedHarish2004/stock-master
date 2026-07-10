import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

const initDb = async () => {
  db.serialize(async () => {
    // Create Admin table
    db.run(`CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // Create Products table with composite unique on (productName, category)
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT,
      category TEXT,
      brand TEXT,
      costPrice REAL,
      defaultSellingPrice REAL,
      stockQty INTEGER,
      vendor TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(productName, category)
    )`);

    // Create Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )`);

    // Add vendor column to existing products safely
    db.run('ALTER TABLE products ADD COLUMN vendor TEXT', (err) => {
      // Ignore error if column already exists
    });

    // Create Sales table
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNo TEXT UNIQUE,
      jobNo TEXT,
      customerName TEXT,
      phone TEXT,
      deliveryDate TEXT,
      saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      grandTotal REAL
    )`);

    // Safely try to add jobNo column for existing databases
    db.run('ALTER TABLE sales ADD COLUMN jobNo TEXT', (err) => {
      // Ignore error if column already exists
    });

    // Create Sale Items table
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER,
      productId INTEGER,
      productName TEXT,
      salePrice REAL,
      qty INTEGER,
      total REAL,
      FOREIGN KEY(saleId) REFERENCES sales(id),
      FOREIGN KEY(productId) REFERENCES products(id)
    )`);

    // Check if admin exists
    db.get("SELECT * FROM admin", async (err, row) => {
      if (!row) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run("INSERT INTO admin (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
        console.log('Default admin created: admin / admin123');
      }
    });
  });
};

// Promisified helper functions
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export default db;
