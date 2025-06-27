const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const AuditService = require('../services/auditService');

// Genera JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Registrazione utente
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Controllo validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { nome, cognome, email, password, ruolo, passwordRuolo } = req.body;

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email già registrata nel sistema'
      });
    }

    // Verifica password ruolo
    const passwordRuoloRequired = ruolo === 'STAFF' 
      ? process.env.STAFF_REGISTRATION_PASSWORD 
      : process.env.ADMIN_REGISTRATION_PASSWORD;

    if (passwordRuolo !== passwordRuoloRequired) {
      return res.status(400).json({
        success: false,
        message: 'Password ruolo non corretta'
      });
    }

    // Crea utente
    const user = await User.create({
      nome,
      cognome,
      email,
      password,
      ruolo
    });

    // Genera token
    const token = generateToken(user.id);

    // Rimuovi password dalla risposta
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      data: {
        user: userResponse,
        token,
        permessi: user.getPermessiDettaglio()
      }
    });

  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante la registrazione'
    });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Controllo validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trova utente
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o password non corrette'
      });
    }

    // Verifica password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email o password non corrette'
      });
    }

    // Verifica se account è attivo
    if (!user.attivo) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato. Contatta l\'amministratore'
      });
    }

    // Aggiorna ultimo accesso
    await user.update({ ultimoAccesso: new Date() });

    // Log audit login
    await AuditService.logLogin(user.id, req);

    // Genera token
    const token = generateToken(user.id);

    // Rimuovi password dalla risposta
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: userResponse,
        token,
        permessi: user.getPermessiDettaglio()
      }
    });

  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante il login'
    });
  }
};

// @desc    Profilo utente corrente
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userResponse = { ...req.user.toJSON() };
    delete userResponse.password;

    res.json({
      success: true,
      data: {
        user: userResponse,
        permessi: req.user.getPermessiDettaglio()
      }
    });
  } catch (error) {
    console.error('Errore profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { nome, cognome, notificheAttive, preferenzeNotifiche } = req.body;

    const updatedFields = {};
    if (nome) updatedFields.nome = nome;
    if (cognome) updatedFields.cognome = cognome;
    if (typeof notificheAttive === 'boolean') updatedFields.notificheAttive = notificheAttive;
    if (preferenzeNotifiche) updatedFields.preferenzeNotifiche = preferenzeNotifiche;

    await req.user.update(updatedFields);

    const userResponse = { ...req.user.toJSON() };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: {
        user: userResponse,
        permessi: req.user.getPermessiDettaglio()
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Cambia password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Verifica password corrente
    const isCurrentPasswordValid = await req.user.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente non corretta'
      });
    }

    // Aggiorna password
    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });

  } catch (error) {
    console.error('Errore cambio password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Logout (invalida token lato client)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};

// 🚀 NUOVO: Login specifico per account condivisi (cross-device)
// @route   POST /api/auth/login-shared
// @access  Public  
const loginShared = async (req, res) => {
  try {
    console.log('🔑 LOGIN SHARED - Richiesta ricevuta:', req.body);
    
    // Controllo validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errori validazione:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    console.log('🔍 Cerco utente con email:', email);

    // Trova utente con email specifica per account condivisi
    const user = await User.findOne({ 
      where: { 
        email: email,
        attivo: true // Solo account attivi
      } 
    });
    
    if (!user) {
      console.log('❌ Utente non trovato:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    console.log('✅ Utente trovato:', {
      id: user.id,
      email: user.email,
      ruolo: user.ruolo,
      permessi: user.permessi
    });

    // Verifica password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Password non valida per:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    console.log('✅ Password verificata per:', email);

    // Aggiorna ultimo accesso
    await user.update({ ultimoAccesso: new Date() });
    
    console.log('✅ Ultimo accesso aggiornato');

    // Log audit login
    try {
      await AuditService.logLogin(user.id, req);
      console.log('✅ Audit log salvato');
    } catch (auditError) {
      console.log('⚠️ Errore audit log (non critico):', auditError.message);
    }

    // 🔑 GENERA TOKEN JWT SPECIFICO PER CROSS-DEVICE
    const tokenPayload = {
      id: user.id,
      email: user.email,
      ruolo: user.ruolo,
      permessi: user.permessi,
      type: 'shared-account', // Identifica come account condiviso
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 giorni
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    console.log('🔑 Token JWT generato per:', email);

    // Prepara risposta utente (senza password)
    const userResponse = {
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      ruolo: user.ruolo,
      permessi: user.permessi,
      livelloPermessi: user.permessi, // Alias per compatibilità frontend
      attivo: user.attivo,
      ultimoAccesso: user.ultimoAccesso,
      dataCreazione: user.createdAt,
      lastLogin: user.ultimoAccesso // Alias per compatibilità
    };
    
    console.log('✅ LOGIN SHARED COMPLETATO per:', email);

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: userResponse,
        token,
        permessi: user.getPermessiDettaglio(),
        tokenType: 'shared-account'
      }
    });

  } catch (error) {
    console.error('❌ ERRORE LOGIN SHARED:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante il login'
    });
  }
};

// 🔑 NUOVO: Verifica token per account condivisi
// @route   GET /api/auth/verify-shared
// @access  Private
const verifySharedToken = async (req, res) => {
  try {
    console.log('🔍 VERIFY SHARED TOKEN - Richiesta ricevuta');
    
    // Il token è già stato verificato dal middleware auth
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
    }
    
    console.log('✅ Token valido per utente:', user.email);

    // Prepara risposta utente
    const userResponse = {
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      ruolo: user.ruolo,
      permessi: user.permessi,
      livelloPermessi: user.permessi, // Alias per compatibilità frontend
      attivo: user.attivo,
      ultimoAccesso: user.ultimoAccesso,
      dataCreazione: user.createdAt,
      lastLogin: user.ultimoAccesso // Alias per compatibilità
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        permessi: user.getPermessiDettaglio(),
        tokenType: 'shared-account',
        isValid: true
      }
    });

  } catch (error) {
    console.error('❌ ERRORE VERIFY SHARED TOKEN:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  loginShared,
  verifySharedToken
}; 