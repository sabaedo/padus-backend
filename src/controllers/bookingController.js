const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const { Booking, User, Notification } = require('../models');
const notificationService = require('../services/notificationService');
const { getFileInfo } = require('../middleware/upload');
const AuditService = require('../services/auditService');
const path = require('path');

// @desc    Crea nuova prenotazione
// @route   POST /api/bookings
// @access  Private (Staff/Admin)
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const bookingData = {
      ...req.body,
      creatoId: String(req.user.id) // 🔧 CAST a stringa per compatibilità
    };

    // Gestisci file allegati se presenti
    if (req.files && req.files.length > 0) {
      const filesInfo = req.files.map(file => getFileInfo(file));
      bookingData.allegati = JSON.stringify(filesInfo);
    }

    // ✅ SEMPRE CONFERMATA - Non serve più controllo permessi
    bookingData.stato = 'CONFERMATA';
    bookingData.processatoDa = String(req.user.id);
    bookingData.dataProcessamento = new Date();

    const booking = await Booking.create(bookingData);
    
    // Log audit creazione
    await AuditService.logCreation(
      req.user.id,
      'PRENOTAZIONE',
      booking.id,
      `Prenotazione creata per ${booking.getNomeCompletoCliente()}`,
      {
        tipo: booking.tipo,
        cliente: booking.getNomeCompletoCliente(),
        data: booking.dataPrenotazione,
        stato: booking.stato
      },
      req
    );
    
    // Includi i dati del creatore nella risposta
    const bookingWithUser = await Booking.findByPk(String(booking.id), {
      include: [
        { model: User, as: 'creatore', attributes: ['id', 'nome', 'cognome', 'email'] },
        { model: User, as: 'processatore', attributes: ['id', 'nome', 'cognome', 'email'] }
      ]
    });

    // Invia notifiche agli admin se la prenotazione è in attesa
    if (booking.stato === 'IN_ATTESA') {
      await notificationService.notifyNewBooking(booking);
    }

    res.status(201).json({
      success: true,
      message: booking.stato === 'CONFERMATA' 
        ? 'Prenotazione creata e confermata automaticamente'
        : 'Prenotazione creata, in attesa di approvazione',
      data: bookingWithUser.getDettagliPrenotazione()
    });

  } catch (error) {
    console.error('Errore creazione prenotazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni tutte le prenotazioni
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      stato, 
      tipo, 
      dataInizio, 
      dataFine,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    
    // Filtri per stato
    if (stato) {
      where.stato = stato;
    }
    
    // Filtri per tipo
    if (tipo) {
      where.tipo = tipo;
    }
    
    // Filtri per data
    if (dataInizio || dataFine) {
      where.dataPrenotazione = {};
      if (dataInizio) where.dataPrenotazione[Op.gte] = dataInizio;
      if (dataFine) where.dataPrenotazione[Op.lte] = dataFine;
    }
    
    // Ricerca per nome cliente o telefono
    if (search) {
      where[Op.or] = [
        { nomeCliente: { [Op.iLike]: `%${search}%` } },
        { cognomeCliente: { [Op.iLike]: `%${search}%` } },
        { telefono: { [Op.iLike]: `%${search}%` } },
        { nomeEvento: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 🔧 CORREZIONE: Controllo robusto per l'ID utente
    const permessi = req.user.getPermessiDettaglio();
    
    // 🆕 CROSS-DEVICE SYNC: Se è una richiesta sync/calendar, mostra tutte le prenotazioni anche per staff base
    const isSync = req.path.includes('/sync') || req.query.sync === 'true';
    const isCalendar = req.path.includes('/calendar') || req.query.calendar === 'true';

    if (!permessi.gestioneAltrui && !isSync && !isCalendar) {
      // Applica filtro solo per richieste normali, non per sync/calendar
      const userId = req.user.id;
      if (!userId) {
        console.error('❌ USER ID NON DEFINITO:', req.user);
        return res.status(500).json({
          success: false,
          message: 'Errore autenticazione utente'
        });
      }
      
      // 🔧 FIX DEFINITIVO: Cast a stringa per compatibilità completa PostgreSQL
      where.creatoId = String(userId);
    }
    
    // 📊 LOG INFORMAZIONI CROSS-DEVICE SYNC
    console.log('🔄 CROSS-DEVICE SYNC INFO:', {
      isSync,
      isCalendar,
      gestioneAltrui: permessi.gestioneAltrui,
      willFilterByUser: !permessi.gestioneAltrui && !isSync && !isCalendar,
      path: req.path
    });

    console.log('📊 QUERY BOOKING CONDITIONS:', {
      where: JSON.stringify(where),
      userID: req.user.id,
      userType: typeof req.user.id,
      isValidUUID: req.user.id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user.id) : false
    });

    // QUERY SEMPLIFICATA: Nessun JOIN per evitare errori database
    const { count, rows } = await Booking.findAndCountAll({
      where,
      attributes: [
        'id', 'tipo', 'nomeCliente', 'cognomeCliente', 'telefono', 
        'dataPrenotazione', 'orarioArrivo', 'numeroPersone', 'numeroAdulti',
        'numeroBambini', 'numeroNeonati', 'nomeEvento', 'numeroPartecipanti',
        'tipoMenu', 'allergie', 'pacchetto', 'sala', 'stato', 'note',
        'motivoRifiuto', 'allegati', 'createdAt', 'updatedAt', 'creatoId', 'processatoDa'
      ],
      order: [['dataPrenotazione', 'DESC'], ['orarioArrivo', 'DESC']],
      limit: parseInt(limit),
      offset,
      raw: true // Evita oggetti Sequelize complessi
    });

    // Con raw: true, rows sono già oggetti semplici JavaScript
    const bookings = rows;

    console.log('✅ BOOKING QUERY SUCCESS:', {
      count,
      rowsReturned: rows.length,
      where: JSON.stringify(where)
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(count / limit),
          count,
          hasNext: offset + rows.length < count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ ERRORE RECUPERO PRENOTAZIONI:', error);
    console.error('❌ ERROR STACK:', error.stack);
    console.error('❌ ERROR SQL:', error.sql);
    console.error('❌ USER DATA:', {
      id: req.user?.id,
      type: typeof req.user?.id,
      permessi: req.user?.permessi
    });
    
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni prenotazioni per calendario
// @route   GET /api/bookings/calendar
// @access  Private
const getCalendarBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      dataPrenotazione: {
        [Op.between]: [startDate, endDate]
      }
    };

    // 🔧 CORREZIONE: Controllo robusto per l'ID utente
    const permessi = req.user.getPermessiDettaglio();
    
    // 🆕 CROSS-DEVICE SYNC: Se è una richiesta sync, mostra tutte le prenotazioni anche per staff base
    const isSync = req.path.includes('/sync') || req.query.sync === 'true';
    
    if (!permessi.gestioneAltrui && !isSync) {
      // Verifica che l'ID sia un UUID valido
      const userId = req.user.id;
      if (!userId) {
        console.error('❌ USER ID NON DEFINITO:', req.user);
        return res.status(500).json({
          success: false,
          message: 'Errore autenticazione utente'
        });
      }
      
      // Verifica formato UUID (molto permissivo)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('❌ USER ID NON È UUID VALIDO:', userId, typeof userId);
        // Se non è UUID, cerca per campo diverso o salta il filtro
        console.log('🔄 Tentativo recupero tutte le prenotazioni per utente non-UUID');
      } else {
        // 🔧 FIX DEFINITIVO: Cast a stringa per compatibilità completa PostgreSQL
        where.creatoId = String(userId);
      }
    }
    
    // 📊 LOG INFORMAZIONI SYNC
    console.log('🔄 CROSS-DEVICE SYNC INFO:', {
      isSync,
      gestioneAltrui: permessi.gestioneAltrui,
      willFilterByUser: !permessi.gestioneAltrui && !isSync,
      path: req.path,
      syncQuery: req.query.sync
    });

    // QUERY SEMPLIFICATA: Nessun JOIN per evitare errori database
    const bookings = await Booking.findAll({
      where,
      attributes: [
        'id', 'tipo', 'nomeCliente', 'cognomeCliente', 'telefono', 
        'dataPrenotazione', 'orarioArrivo', 'numeroPersone', 'numeroAdulti',
        'numeroRagazzi', 'numeroBambini', 'numeroNeonati', 'nomeEvento', 'numeroPartecipanti',
        'tipoMenu', 'allergie', 'pacchetto', 'sala', 'stato', 'note',
        'motivoRifiuto', 'allegati', 'createdAt', 'updatedAt', 'creatoId'
      ],
      order: [['dataPrenotazione', 'ASC'], ['orarioArrivo', 'ASC']],
      raw: true
    });

    // 🔧 CORREZIONE: Formatta per il calendario con dati raw
    const calendarEvents = bookings.map(booking => {
      // Calcola nome cliente
      const nomeCompleto = `${booking.nomeCliente || ''} ${booking.cognomeCliente || ''}`.trim();
      
      // Calcola numero persone
      let numPersone = 0;
      if (booking.tipo === 'EVENTO') {
        numPersone = booking.numeroPartecipanti || 0;
      } else {
        numPersone = (booking.numeroPersone || 0) + (booking.numeroAdulti || 0) + (booking.numeroRagazzi || 0) + (booking.numeroBambini || 0) + (booking.numeroNeonati || 0);
      }
      
      return {
      id: booking.id,
        title: `${nomeCompleto} (${numPersone}p)`,
      start: `${booking.dataPrenotazione}T${booking.orarioArrivo}`,
      type: booking.tipo,
      status: booking.stato,
        cliente: nomeCompleto,
      telefono: booking.telefono,
        persone: numPersone,
      note: booking.note,
        createdBy: 'Admin', // Placeholder poiché no JOIN
      sala: booking.sala
      };
    });

    res.json({
      success: true,
      data: calendarEvents
    });

  } catch (error) {
    console.error('Errore calendario prenotazioni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni singola prenotazione
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(String(req.params.id), {
      include: [
        { model: User, as: 'creatore', attributes: ['id', 'nome', 'cognome', 'email'] },
        { model: User, as: 'processatore', attributes: ['id', 'nome', 'cognome', 'email'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }

    // Controlla permessi
    const permessi = req.user.getPermessiDettaglio();
    // 🔧 CAST ESPLICITO per PostgreSQL: Converte a stringa per confronto sicuro
    const userIdStr = String(req.user.id);
    const bookingCreatorIdStr = String(booking.creatoId);
    if (!permessi.gestioneAltrui && bookingCreatorIdStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Non puoi visualizzare questa prenotazione'
      });
    }

    res.json({
      success: true,
      data: booking.getDettagliPrenotazione()
    });

  } catch (error) {
    console.error('Errore recupero prenotazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Aggiorna prenotazione
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const booking = req.booking; // Viene dal middleware canModifyBooking

    const oldStatus = booking.stato;
    await booking.update(req.body);

    // Ricarica con relazioni
    await booking.reload({
      include: [
        { model: User, as: 'creatore', attributes: ['id', 'nome', 'cognome', 'email'] },
        { model: User, as: 'processatore', attributes: ['id', 'nome', 'cognome', 'email'] }
      ]
    });

    // Invia notifica se lo stato è cambiato
    if (oldStatus !== booking.stato) {
      await notificationService.notifyBookingStatusChange(booking, oldStatus);
    }

    res.json({
      success: true,
      message: 'Prenotazione aggiornata con successo',
      data: booking.getDettagliPrenotazione()
    });

  } catch (error) {
    console.error('Errore aggiornamento prenotazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Conferma/Rifiuta prenotazione (Admin)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin/Admin Secondario)
const updateBookingStatus = async (req, res) => {
  try {
    const { stato, motivoRifiuto } = req.body;
    const bookingId = String(req.params.id); // 🔧 Cast String per compatibilità PostgreSQL

    if (!['CONFERMATA', 'RIFIUTATA'].includes(stato)) {
      return res.status(400).json({
        success: false,
        message: 'Stato non valido. Utilizzare CONFERMATA o RIFIUTATA'
      });
    }

    const booking = await Booking.findByPk(String(bookingId), {
      include: [
        { model: User, as: 'creatore', attributes: ['id', 'nome', 'cognome', 'email'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }

    const oldStatus = booking.stato;

    await booking.update({
      stato,
      motivoRifiuto: stato === 'RIFIUTATA' ? motivoRifiuto : null,
      processatoDa: String(req.user.id), // 🔧 Cast a stringa per compatibilità PostgreSQL
      dataProcessamento: new Date()
    });

    // Ricarica con processatore
    await booking.reload({
      include: [
        { model: User, as: 'creatore', attributes: ['id', 'nome', 'cognome', 'email'] },
        { model: User, as: 'processatore', attributes: ['id', 'nome', 'cognome', 'email'] }
      ]
    });

    // Invia notifica al creatore
    await notificationService.notifyBookingStatusChange(booking, oldStatus);

    res.json({
      success: true,
      message: `Prenotazione ${stato.toLowerCase()} con successo`,
      data: booking.getDettagliPrenotazione()
    });

  } catch (error) {
    console.error('Errore aggiornamento stato prenotazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Elimina prenotazione
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
  try {
    const booking = req.booking; // Viene dal middleware canModifyBooking

    await booking.destroy();

    // Invia notifica di cancellazione
    await notificationService.notifyBookingCancelled(booking);

    res.json({
      success: true,
      message: 'Prenotazione eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione prenotazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni cronologia prenotazioni utente
// @route   GET /api/bookings/my-history
// @access  Private
const getMyBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Booking.findAndCountAll({
      where: { 
        creatoId: String(req.user.id) // 🔧 Cast a stringa per compatibilità PostgreSQL
      },
      include: [
        { model: User, as: 'processatore', attributes: ['id', 'nome', 'cognome'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const history = rows.map(booking => ({
      ...booking.getDettagliPrenotazione(),
      processedBy: booking.processatore?.nome + ' ' + booking.processatore?.cognome
    }));

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(count / limit),
          count
        }
      }
    });

  } catch (error) {
    console.error('Errore cronologia prenotazioni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Aggiungi allegati a prenotazione
// @route   POST /api/bookings/:id/attachments
// @access  Private
const addAttachments = async (req, res) => {
  try {
    const booking = req.booking; // Viene dal middleware canModifyBooking

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file selezionato'
      });
    }

    // Ottieni allegati esistenti
    let existingAttachments = [];
    if (booking.allegati) {
      try {
        existingAttachments = JSON.parse(booking.allegati);
      } catch (error) {
        console.error('Errore parsing allegati esistenti:', error);
      }
    }

    // Aggiungi nuovi allegati
    const newAttachments = req.files.map(file => getFileInfo(file));
    const allAttachments = [...existingAttachments, ...newAttachments];

    await booking.update({
      allegati: JSON.stringify(allAttachments)
    });

    res.json({
      success: true,
      message: `${newAttachments.length} allegati aggiunti con successo`,
      data: {
        newAttachments,
        totalAttachments: allAttachments.length
      }
    });

  } catch (error) {
    console.error('Errore aggiunta allegati:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Rimuovi allegato da prenotazione
// @route   DELETE /api/bookings/:id/attachments/:filename
// @access  Private
const removeAttachment = async (req, res) => {
  try {
    const booking = req.booking; // Viene dal middleware canModifyBooking
    const filename = req.params.filename;

    if (!booking.allegati) {
      return res.status(404).json({
        success: false,
        message: 'Nessun allegato trovato'
      });
    }

    let attachments = [];
    try {
      attachments = JSON.parse(booking.allegati);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Errore nel formato degli allegati'
      });
    }

    // Trova e rimuovi l'allegato
    const attachmentIndex = attachments.findIndex(att => att.filename === filename);
    
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }

    attachments.splice(attachmentIndex, 1);

    await booking.update({
      allegati: attachments.length > 0 ? JSON.stringify(attachments) : null
    });

    // Elimina fisicamente il file
    const { deleteFile } = require('../middleware/upload');
    deleteFile(path.join('./uploads/bookings', filename));

    res.json({
      success: true,
      message: 'Allegato rimosso con successo',
      data: {
        remainingAttachments: attachments.length
      }
    });

  } catch (error) {
    console.error('Errore rimozione allegato:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
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
}; 