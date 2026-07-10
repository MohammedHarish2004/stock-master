import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(authMiddleware);

router.get('/', (req, res) => {
  const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
  res.download(dbPath, `backup-${new Date().toISOString().split('T')[0]}.sqlite`);
});

export default router;
