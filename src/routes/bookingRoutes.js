const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

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

// const { syncLimiter } = require('../middleware/rateLimiter'); // DISABILITATO RATE LIMITING

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

// 🔥 NUOVO: Endpoint per cancellare TUTTE le prenotazioni
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('🔥 CLEAR-ALL ENDPOINT - RICHIESTA RICEVUTA:', {
      method: req.method,
      url: req.url,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        type: req.user.type
      } : 'NO USER'
    });
    
    // Verifica autenticazione
    if (!req.user) {
      console.error('❌ CLEAR-ALL - Utente non autenticato');
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }
    
    // Verifica modello
    if (!Booking) {
      console.error('❌ CLEAR-ALL - Modello Booking non disponibile');
      return res.status(500).json({
        success: false,
        message: 'Errore interno: modello Booking non disponibile'
      });
    }
    
    // Prima conta quante prenotazioni ci sono
    const countBefore = await Booking.count();
    console.log('🔥 CLEAR-ALL - Prenotazioni da eliminare:', countBefore);
    
    // Cancella TUTTE le prenotazioni
    const deletedCount = await Booking.destroy({
      where: {}, // Condizione vuota = cancella tutto
      truncate: false // Non usare TRUNCATE per preservare log
    });
    
    console.log('✅ CLEAR-ALL - Prenotazioni eliminate:', deletedCount);
    
    // Verifica che sia tutto vuoto
    const countAfter = await Booking.count();
    console.log('✅ CLEAR-ALL - Prenotazioni rimanenti:', countAfter);
    
    const response = {
      success: true,
      message: `Eliminate ${deletedCount} prenotazioni`,
      deletedCount,
      remainingCount: countAfter,
      timestamp: Date.now()
    };
    
    console.log('✅ CLEAR-ALL - Risposta preparata:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ CLEAR-ALL - Errore completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: 'Errore durante la cancellazione: ' + error.message,
      errorCode: error.code || 'UNKNOWN',
      errorName: error.name || 'Unknown'
    });
  }
});

// 🔄 NUOVO: Endpoint per sincronizzazione cross-device (PRIMA delle route con parametri)
router.get('/sync', async (req, res) => {
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
    
    // CONTROLLO PRELIMINARE: Verifica che req.user esista
    if (!req.user) {
      console.error('❌ SYNC ENDPOINT - req.user è undefined');
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }
    
    console.log('✅ SYNC ENDPOINT - Utente autenticato:', {
      userId: req.user.id,
      userType: req.user.type,
      deviceId: req.headers['x-device-id']
    });

    // CONTROLLO MODELLO: Verifica che Booking sia disponibile
    if (!Booking) {
      console.error('❌ SYNC ENDPOINT - Modello Booking non disponibile');
      return res.status(500).json({
        success: false,
        message: 'Errore interno: modello Booking non disponibile'
      });
    }
    
    console.log('✅ SYNC ENDPOINT - Modello Booking disponibile');

    // Recupera tutte le prenotazioni dell'utente o globali per accesso diretto
    let bookings;
    
    if (req.user.type === 'local-access') {
      console.log('🔍 SYNC ENDPOINT - Utente accesso diretto, carico tutte le prenotazioni');
      try {
        // QUERY SEMPLIFICATA: Solo tabella bookings, nessun JOIN
        bookings = await Booking.findAll({
          attributes: [
            'id', 'tipo', 'nomeCliente', 'cognomeCliente', 'telefono', 
            'dataPrenotazione', 'orarioArrivo', 'numeroPersone', 'numeroAdulti',
            'numeroBambini', 'numeroNeonati', 'nomeEvento', 'numeroPartecipanti',
            'tipoMenu', 'allergie', 'pacchetto', 'sala', 'stato', 'note',
            'motivoRifiuto', 'allegati', 'createdAt', 'updatedAt'
          ],
          order: [['createdAt', 'DESC']],
          limit: 1000, // Limite ragionevole
          raw: true // Evita oggetti Sequelize complessi
        });
        console.log('✅ SYNC ENDPOINT - Query findAll SEMPLIFICATA completata per accesso diretto');
      } catch (dbError) {
        console.error('❌ SYNC ENDPOINT - Errore query findAll (accesso diretto):', dbError);
        throw dbError;
      }
    } else {
      console.log('🔍 SYNC ENDPOINT - Utente registrato, carico solo sue prenotazioni');
      try {
        // QUERY SEMPLIFICATA: Solo tabella bookings, nessun JOIN
        bookings = await Booking.findAll({
          attributes: [
            'id', 'tipo', 'nomeCliente', 'cognomeCliente', 'telefono', 
            'dataPrenotazione', 'orarioArrivo', 'numeroPersone', 'numeroAdulti',
            'numeroBambini', 'numeroNeonati', 'nomeEvento', 'numeroPartecipanti',
            'tipoMenu', 'allergie', 'pacchetto', 'sala', 'stato', 'note',
            'motivoRifiuto', 'allegati', 'createdAt', 'updatedAt'
          ],
          where: { 
            creatoId: String(req.user.id) // 🔧 Cast a stringa per compatibilità PostgreSQL
          },
          order: [['createdAt', 'DESC']],
          raw: true // Evita oggetti Sequelize complessi
        });
        console.log('✅ SYNC ENDPOINT - Query findAll SEMPLIFICATA completata per utente registrato');
      } catch (dbError) {
        console.error('❌ SYNC ENDPOINT - Errore query findAll (utente registrato):', dbError);
        throw dbError;
      }
    }

    console.log('🔄 SYNC ENDPOINT - Prenotazioni trovate:', bookings ? bookings.length : 'NULL');

    const response = {
      success: true,
      data: bookings || [],
      timestamp: Date.now(),
      deviceId: req.headers['x-device-id']
    };
    
    console.log('✅ SYNC ENDPOINT - Risposta preparata:', {
      success: response.success,
      dataCount: response.data.length,
      timestamp: response.timestamp
    });

    res.json(response);
    console.log('✅ SYNC ENDPOINT - Risposta inviata con successo');

  } catch (error) {
    console.error('❌ SYNC ENDPOINT - Errore completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      user: req.user ? req.user.id : 'NO USER'
    });
    res.status(500).json({
      success: false,
      message: 'Errore durante la sincronizzazione: ' + error.message,
      errorCode: error.code || 'UNKNOWN',
      errorName: error.name || 'Unknown'
    });
  }
});

// 🔄 NUOVO: Endpoint per push sincronizzazione
router.post('/sync', async (req, res) => {
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
            where: { id: String(bookingData.id) } // 🔧 Cast String per compatibilità PostgreSQL
          });

          if (existingBooking) {
            // Aggiorna se il timestamp è più recente
            const existingTimestamp = new Date(existingBooking.updatedAt).getTime();
            const newTimestamp = new Date(bookingData._timestamp || bookingData.createdAt).getTime();
            
            if (newTimestamp > existingTimestamp) {
              // 🔧 Normalizza tutti gli ID prima dell'update
              const normalizedUpdateData = {
                ...bookingData,
                id: String(bookingData.id),
                creatoId: bookingData.creatoId ? String(bookingData.creatoId) : existingBooking.creatoId,
                processatoDa: bookingData.processatoDa ? String(bookingData.processatoDa) : existingBooking.processatoDa
              };
              
              await existingBooking.update(normalizedUpdateData);
              results.bookings.updated++;
              console.log('📝 SYNC PUSH - Prenotazione aggiornata:', bookingData.id);
            }
          } else {
            // Crea nuova prenotazione - 🔧 Normalizza tutti gli ID
            const normalizedBookingData = {
              ...bookingData,
              id: String(bookingData.id), // 🔧 Cast String per ID
              creatoId: String(req.user.id), // 🔧 Cast String per compatibilità PostgreSQL
              stato: bookingData.stato || 'confermata'
            };
            
            await Booking.create(normalizedBookingData);
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
  .get(getBookings) // RIMUOVO COMPLETAMENTE RATE LIMITING dalla GET principale
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