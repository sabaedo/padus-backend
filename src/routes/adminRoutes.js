const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStaffUsers,
  updateUserPermissions,
  updateUserStatus,
  getDashboardStats,
  getUserDetails
} = require('../controllers/adminController');

// Import middleware
const { 
  authenticate, 
  isAdmin, 
  isAdminOrSecondary 
} = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Dashboard statistiche (accessibile ad admin e admin secondari)
router.get('/dashboard', isAdminOrSecondary, getDashboardStats);

// Gestione utenti (solo admin)
router.get('/users', isAdmin, getStaffUsers);
router.get('/users/:id', isAdmin, getUserDetails);
router.patch('/users/:id/permissions', isAdmin, updateUserPermissions);
router.patch('/users/:id/status', isAdmin, updateUserStatus);

module.exports = router; 