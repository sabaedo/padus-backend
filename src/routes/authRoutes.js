const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

// Import middleware
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Import validators
const { registerValidator, loginValidator } = require('../validators/authValidators');

// Public routes
router.post('/register', registerLimiter, registerValidator, register);
router.post('/login', loginLimiter, loginValidator, login);

// Private routes (require authentication)
router.use(authenticate); // Applica autenticazione a tutte le route sottostanti

router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router; 