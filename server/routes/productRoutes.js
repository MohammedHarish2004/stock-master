import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductSales } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/sales', getProductSales);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
