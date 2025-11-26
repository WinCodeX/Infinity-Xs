import express from 'express';
import { createProduct, getProducts } from '../controllers/product.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize(UserRole.ADMIN, UserRole.STAFF), createProduct);

export default router;
