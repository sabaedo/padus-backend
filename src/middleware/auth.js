const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware per autenticazione JWT
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token di accesso richiesto'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
    }
    
    if (!user.attivo) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato'
      });
    }
    
    // Aggiorna ultimo accesso
    user.ultimoAccesso = new Date();
    await user.save();
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token scaduto'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Errore di autenticazione'
    });
  }
};

// Middleware per autorizzazione ruoli
const authorize = (...ruoli) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accesso non autorizzato'
      });
    }
    
    if (!ruoli.includes(req.user.ruolo)) {
      return res.status(403).json({
        success: false,
        message: 'Permessi insufficienti per questa operazione'
      });
    }
    
    next();
  };
};

// Middleware per autorizzazione permessi specifici
const authorizePermission = (permessoRichiesto) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accesso non autorizzato'
      });
    }
    
    const permessi = req.user.getPermessiDettaglio();
    
    if (!permessi[permessoRichiesto]) {
      return res.status(403).json({
        success: false,
        message: `Permesso '${permessoRichiesto}' richiesto per questa operazione`
      });
    }
    
    next();
  };
};

// Middleware per verificare se l'utente può modificare una prenotazione
const canModifyBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.body.bookingId;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'ID prenotazione richiesto'
      });
    }
    
    const { Booking } = require('../models');
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    const permessi = req.user.getPermessiDettaglio();
    
    // Admin può modificare tutto
    if (permessi.gestioneAltrui) {
      req.booking = booking;
      return next();
    }
    
    // Staff può modificare solo le proprie prenotazioni in stato IN_ATTESA
    if (booking.creatoId === req.user.id && booking.stato === 'IN_ATTESA') {
      req.booking = booking;
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Non puoi modificare questa prenotazione'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore di autorizzazione'
    });
  }
};

// Middleware per verificare se l'utente è admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.ruolo !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accesso riservato agli amministratori'
    });
  }
  next();
};

// Middleware per verificare permessi admin o admin secondario
const isAdminOrSecondary = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Accesso non autorizzato'
    });
  }
  
  const permessi = req.user.getPermessiDettaglio();
  
  if (!permessi.visualizzaDashboard) {
    return res.status(403).json({
      success: false,
      message: 'Permessi insufficienti per accedere alla dashboard'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizePermission,
  canModifyBooking,
  isAdmin,
  isAdminOrSecondary
}; 