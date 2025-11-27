import express, { RequestHandler } from 'express';
import { createProduct, getProducts } from '../product/product.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../types';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect as RequestHandler, authorize(UserRole.ADMIN, UserRole.STAFF) as RequestHandler, createProduct as RequestHandler);

export default router;
