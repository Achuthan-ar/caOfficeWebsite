import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshUserToken,
  logoutUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateSchema, loginSchema, registerSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', validateSchema(registerSchema), registerUser);
router.post('/login', validateSchema(loginSchema), loginUser);
router.post('/refresh-token', refreshUserToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getUserProfile);

export default router;
