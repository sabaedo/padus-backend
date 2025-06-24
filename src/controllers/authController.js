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

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
}; 