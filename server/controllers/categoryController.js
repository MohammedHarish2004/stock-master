import { query, run } from '../database/db.js';
import { io } from '../server.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    await run('INSERT INTO categories (name) VALUES (?)', [name]);
    io.emit('category-updated');
    res.status(201).json({ message: 'Category added' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    io.emit('category-updated');
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
};
