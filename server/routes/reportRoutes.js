import express from 'express';
import { getProfitLossReport } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profit-loss', getProfitLossReport);

export default router;

