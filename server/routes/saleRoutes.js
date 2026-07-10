import express from 'express';
import { getSales, getSaleById, createSale, getDashboardStats, deleteSale } from '../controllers/saleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSales);
router.get('/dashboard-stats', getDashboardStats);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;
