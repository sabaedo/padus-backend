const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 🔑 NUOVO: Gestione token di accesso diretto
const handleLocalAccess = (token, req, res, next) => {
  try {
    console.log('🔑 MIDDLEWARE - Gestione token locale INIZIATA:', token.substring(0, 50) + '...');
    
    // Decodifica il token locale
    const tokenData = token.replace('local_', '');
    console.log('🔍 MIDDLEWARE - Token data estratto (primi 50 char):', tokenData.substring(0, 50) + '...');
    
    let payload;
    try {
      // Ripristina il padding Base64 e normalizza caratteri URL-safe
      let normalizedToken = tokenData.replace(/-/g, '+').replace(/_/g, '/');
      // Aggiungi padding se necessario
      while (normalizedToken.length % 4) {
        normalizedToken += '=';
      }
      
      // Usa Buffer invece di atob() per compatibilità Node.js
      const decoded = Buffer.from(normalizedToken, 'base64').toString('utf8');
      payload = JSON.parse(decoded);
      console.log('🔍 MIDDLEWARE - Payload decodificato con successo:', payload);
    } catch (decodeError) {
      console.error('❌ MIDDLEWARE - Errore decodifica Base64:', decodeError);
      console.error('❌ MIDDLEWARE - Token data problematico:', tokenData.substring(0, 100));
      throw new Error('Token locale malformato - errore decodifica');
    }
    
    // Verifica che sia un token di accesso locale valido
    if (payload.type !== 'local-access') {
      console.error('❌ MIDDLEWARE - Tipo token non valido:', payload.type);
      throw new Error('Token locale non valido - tipo errato');
    }
    
    // Verifica scadenza
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('❌ MIDDLEWARE - Token scaduto:', { exp: payload.exp, now });
      throw new Error('Token locale scaduto');
    }
    
    console.log('✅ MIDDLEWARE - Validazione token locale completata, creo utente virtuale');
    
    // Crea un utente virtuale per questa sessione
    req.user = {
      id: payload.id,
      email: payload.email,
      nome: payload.ruolo === 'ADMIN' ? 'Amministratore' : 'Staff',
      cognome: 'Sistema',
      ruolo: payload.ruolo,
      livelloPermessi: payload.livelloPermessi,
      type: 'local-access',
      attivo: true,
      ultimoAccesso: new Date(),
      
      // Metodo per ottenere permessi dettagliati
      getPermessiDettaglio: function() {
        const isAdmin = this.ruolo === 'ADMIN';
        const isAdminLevel = this.livelloPermessi === 'AMMINISTRATORE';
        
        return {
          visualizzaDashboard: true,
          creaPrenotazioni: true,
          modificaPersonali: true,
          modificaAltrui: isAdmin || isAdminLevel,
          gestioneAltrui: isAdmin || isAdminLevel,
          gestioneUtenti: isAdmin,
          gestionePermessi: isAdmin,
          accesso: 'DIRETTO'
        };
      },
      
      // Mock del metodo save per compatibilità
      save: async function() {
        console.log('🔄 MIDDLEWARE - Save chiamato su utente locale (no-op)');
        return Promise.resolve();
      }
    };
    
    console.log('✅ MIDDLEWARE - Utente locale autenticato con successo:', {
      id: req.user.id,
      email: req.user.email,
      ruolo: req.user.ruolo,
      type: req.user.type,
      permessi: req.user.getPermessiDettaglio()
    });
    
    console.log('➡️ MIDDLEWARE - Chiamando next() per continuare la richiesta');
    next();
  } catch (error) {
    console.error('❌ MIDDLEWARE - Errore token locale DETTAGLIATO:', {
      error: error.message,
      stack: error.stack,
      token: token ? token.substring(0, 30) + '...' : 'NO TOKEN'
    });
    return res.status(401).json({
      success: false,
      message: 'Token di accesso diretto non valido: ' + error.message
    });
  }
};

// Middleware per autenticazione JWT
const authenticate = async (req, res, next) => {
  try {
    console.log('🔍 MIDDLEWARE - Ricevuta richiesta:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? 'PRESENTE' : 'ASSENTE',
        'content-type': req.headers['content-type']
      }
    });
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔑 MIDDLEWARE - Token estratto:', token ? token.substring(0, 20) + '...' : 'NESSUN TOKEN');
    
    if (!token) {
      console.log('❌ MIDDLEWARE - Token mancante, restituisco 401');
      return res.status(401).json({
        success: false,
        message: 'Token di accesso richiesto'
      });
    }
    
    // 🔑 NUOVO: Riconosce e gestisce token di accesso diretto
    if (token.startsWith('local_')) {
      console.log('🔑 MIDDLEWARE - Token locale rilevato, chiamo handleLocalAccess');
      return handleLocalAccess(token, req, res, next);
    }
    
    // Autenticazione JWT normale per utenti registrati
    console.log('🔑 MIDDLEWARE - Token JWT normale');
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
    console.error('❌ MIDDLEWARE - Errore autenticazione:', error);
    
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