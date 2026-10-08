const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  login, logout, getMe, refreshToken,
  forgotPassword, resetPassword, updateProfile, updatePassword
} = require('../controllers/authController');

// No self-signup: managers create accounts from the Users page
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;
