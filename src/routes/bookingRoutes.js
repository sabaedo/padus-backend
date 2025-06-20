const express = require('express');
const router = express.Router();

// Import controllers
const {
  createBooking,
  getBookings,
  getCalendarBookings,
  getBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  getMyBookingHistory,
  addAttachments,
  removeAttachment
} = require('../controllers/bookingController');

// Import middleware
const { 
  authenticate, 
  authorizePermission, 
  canModifyBooking, 
  isAdminOrSecondary 
} = require('../middleware/auth');

const { 
  uploadMultiple, 
  handleUploadError 
} = require('../middleware/upload');

// Import validators
const {
  createBookingValidator,
  updateBookingValidator,
  updateStatusValidator,
  calendarQueryValidator
} = require('../validators/bookingValidators');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Routes per cronologia personale (prima delle route con parametri)
router.get('/my-history', getMyBookingHistory);

// Routes per calendario
router.get('/calendar', calendarQueryValidator, getCalendarBookings);

// Routes CRUD prenotazioni
router.route('/')
  .get(getBookings)
  .post(
    authorizePermission('creaPrenotazioni'), 
    uploadMultiple, 
    handleUploadError, 
    createBookingValidator, 
    createBooking
  );

router.route('/:id')
  .get(getBooking)
  .put(canModifyBooking, updateBookingValidator, updateBooking)
  .delete(canModifyBooking, deleteBooking);

// Route per aggiornamento stato (solo admin/admin secondario)
router.patch('/:id/status', 
  isAdminOrSecondary, 
  updateStatusValidator, 
  updateBookingStatus
);

// Routes per gestione allegati
router.post('/:id/attachments', 
  canModifyBooking, 
  uploadMultiple, 
  handleUploadError, 
  addAttachments
);

router.delete('/:id/attachments/:filename', 
  canModifyBooking, 
  removeAttachment
);

module.exports = router; 