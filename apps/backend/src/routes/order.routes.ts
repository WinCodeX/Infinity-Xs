import express from 'express';
import { createOrder } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();
router.post('/', protect, createOrder);
export default router;
