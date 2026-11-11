import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { dbPath } from '../database/db.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.download(dbPath, `backup-${new Date().toISOString().split('T')[0]}.sqlite`);
});

export default router;
