const express = require('express');
const router = express.Router();

// Import controllers
const {
  getMyProfile,
  getMyActivity,
  getMyBookingsHistory,
  exportMyHistoryCSV,
  exportMyHistoryPDF
} = require('../controllers/profileController');

// Import middleware
const { authenticate } = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Profilo personale completo
router.get('/me', getMyProfile);

// Cronologia attività personale
router.get('/my-activity', getMyActivity);

// Cronologia prenotazioni personali
router.get('/my-bookings', getMyBookingsHistory);

// Esportazioni cronologia personale
router.get('/export/my-history/csv', exportMyHistoryCSV);
router.get('/export/my-history/pdf', exportMyHistoryPDF);

module.exports = router; 