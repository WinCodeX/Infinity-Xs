import express from 'express';
import { addToCart, getCart } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect); // All cart routes are protected

router.route('/')
  .get(getCart)
  .post(addToCart);

export default router;
