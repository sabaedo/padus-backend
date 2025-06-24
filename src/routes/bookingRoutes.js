const express = require('express');
const router = express.Router();

// Import models
const { Booking } = require('../models');

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

const { syncLimiter } = require('../middleware/rateLimiter');

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

// 🔄 NUOVO: Endpoint per sincronizzazione cross-device (PRIMA delle route con parametri)
router.get('/sync', syncLimiter, async (req, res) => {
  try {
    console.log('🔄 SYNC ENDPOINT GET - RICHIESTA RICEVUTA:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? 'PRESENTE' : 'ASSENTE',
        'x-device-id': req.headers['x-device-id']
      },
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        type: req.user.type
      } : 'NO USER'
    });
    
    console.log('🔄 SYNC ENDPOINT - Richiesta sincronizzazione da:', {
      userId: req.user.id,
      userType: req.user.type,
      deviceId: req.headers['x-device-id']
    });

    // Recupera tutte le prenotazioni dell'utente o globali per accesso diretto
    let bookings;
    
    if (req.user.type === 'local-access') {
      console.log('🔍 SYNC ENDPOINT - Utente accesso diretto, carico tutte le prenotazioni');
      // Per accesso diretto, restituisci tutte le prenotazioni
      bookings = await Booking.findAll({
        order: [['createdAt', 'DESC']],
        limit: 1000 // Limite ragionevole
      });
    } else {
      console.log('🔍 SYNC ENDPOINT - Utente registrato, carico solo sue prenotazioni');
      // Per utenti registrati, solo le loro prenotazioni
      bookings = await Booking.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }

    console.log('🔄 SYNC ENDPOINT - Prenotazioni trovate:', bookings.length);

    const response = {
      success: true,
      data: bookings,
      timestamp: Date.now(),
      deviceId: req.headers['x-device-id']
    };
    
    console.log('✅ SYNC ENDPOINT - Risposta inviata:', {
      success: response.success,
      dataCount: response.data.length,
      timestamp: response.timestamp
    });

    res.json(response);

  } catch (error) {
    console.error('❌ SYNC ENDPOINT - Errore completo:', {
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : 'NO USER'
    });
    res.status(500).json({
      success: false,
      message: 'Errore durante la sincronizzazione: ' + error.message
    });
  }
});

// 🔄 NUOVO: Endpoint per push sincronizzazione
router.post('/sync', syncLimiter, async (req, res) => {
  try {
    console.log('🔄 SYNC ENDPOINT POST - RICHIESTA RICEVUTA:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? 'PRESENTE' : 'ASSENTE',
        'x-device-id': req.headers['x-device-id']
      },
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        type: req.user.type
      } : 'NO USER',
      bodyKeys: Object.keys(req.body)
    });
    
    const { bookings, stats, deviceId } = req.body;
    
    console.log('🔄 SYNC PUSH - Ricevuti dati da dispositivo:', {
      deviceId,
      bookingsCount: bookings?.length || 0,
      hasStats: !!stats
    });

    const results = {
      bookings: { created: 0, updated: 0, errors: 0 },
      stats: null
    };

    // Sincronizza prenotazioni se presenti
    if (bookings && Array.isArray(bookings)) {
      console.log('🔄 SYNC PUSH - Processando prenotazioni:', bookings.length);
      for (const bookingData of bookings) {
        try {
          // Cerca prenotazione esistente per ID
          const existingBooking = await Booking.findOne({
            where: { id: bookingData.id }
          });

          if (existingBooking) {
            // Aggiorna se il timestamp è più recente
            const existingTimestamp = new Date(existingBooking.updatedAt).getTime();
            const newTimestamp = new Date(bookingData._timestamp || bookingData.createdAt).getTime();
            
            if (newTimestamp > existingTimestamp) {
              await existingBooking.update(bookingData);
              results.bookings.updated++;
              console.log('📝 SYNC PUSH - Prenotazione aggiornata:', bookingData.id);
            }
          } else {
            // Crea nuova prenotazione
            await Booking.create({
              ...bookingData,
              userId: req.user.type === 'local-access' ? null : req.user.id,
              stato: bookingData.stato || 'confermata'
            });
            results.bookings.created++;
            console.log('➕ SYNC PUSH - Nuova prenotazione creata:', bookingData.id);
          }
        } catch (bookingError) {
          console.error('❌ SYNC PUSH - Errore prenotazione:', bookingError);
          results.bookings.errors++;
        }
      }
    }

    console.log('✅ SYNC PUSH - Risultati finali:', results);

    res.json({
      success: true,
      results,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ SYNC PUSH - Errore generale completo:', {
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : 'NO USER'
    });
    res.status(500).json({
      success: false,
      message: 'Errore durante il push della sincronizzazione: ' + error.message
    });
  }
});

// Routes per cronologia personale (prima delle route con parametri)
router.get('/my-history', getMyBookingHistory);

// Routes per calendario
router.get('/calendar', calendarQueryValidator, getCalendarBookings);

// Routes CRUD prenotazioni
router.route('/')
  .get(syncLimiter, getBookings) // Aggiungo syncLimiter più permissivo anche alla GET principale
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