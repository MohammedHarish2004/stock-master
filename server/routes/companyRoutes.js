import express from 'express';
import { get, run } from '../database/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Get company info
router.get('/', async (req, res) => {
  try {
    const row = await get('SELECT * FROM company_info LIMIT 1');
    res.json(row || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch company info' });
  }
});

// Update company info
router.put('/', async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    await run(
      'UPDATE company_info SET name = ?, address = ?, phone = ? WHERE id = (SELECT id FROM company_info LIMIT 1)',
      [name, address, phone]
    );
    res.json({ success: true, message: 'Company info updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update company info' });
  }
});

export default router;
