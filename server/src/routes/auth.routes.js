import express from 'express';
import { register, login, logout, getProfile, verifyEmail, resendOtp, forgotPassword, resetPassword, updateProfile, changePassword, requestPasswordOtp, requestTwoFactorOtp, toggleTwoFactor } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/password-otp', protect, requestPasswordOtp);
router.post('/2fa-otp', protect, requestTwoFactorOtp);
router.post('/2fa-toggle', protect, toggleTwoFactor);
router.put('/password', protect, changePassword);

export default router;
