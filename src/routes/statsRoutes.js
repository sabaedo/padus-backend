const express = require('express');
const router = express.Router();

// Import controllers
const {
  exportBookingsCSV,
  exportBookingsPDF,
  getStatsOverview,
  getStaffStats
} = require('../controllers/statsController');

// Import middleware
const { 
  authenticate, 
  isAdmin, 
  isAdminOrSecondary 
} = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Statistiche generali (admin e admin secondari)
router.get('/overview', isAdminOrSecondary, getStatsOverview);

// Statistiche staff (solo admin)
router.get('/staff', isAdmin, getStaffStats);

// Esportazioni (admin e admin secondari)
router.get('/export/bookings/csv', isAdminOrSecondary, exportBookingsCSV);
router.get('/export/bookings/pdf', isAdminOrSecondary, exportBookingsPDF);

module.exports = router; 