const jwt = require('jsonwebtoken');
const { User } = require('../models');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Token di autenticazione richiesto'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new Error('Utente non trovato'));
    }
    
    if (!user.attivo) {
      return next(new Error('Account disattivato'));
    }
    
    // Aggiunge i dati utente al socket
    socket.userId = user.id;
    socket.userRole = user.ruolo;
    socket.userPermissions = user.getPermessiDettaglio();
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Errore autenticazione Socket.IO:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Token non valido'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token scaduto'));
    }
    
    return next(new Error('Errore di autenticazione'));
  }
};

module.exports = socketAuth; 