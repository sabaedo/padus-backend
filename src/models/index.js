const User = require('./User');
const Booking = require('./Booking');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// Definizione delle associazioni

// User - Booking associations
User.hasMany(Booking, {
  foreignKey: 'creatoId',
  as: 'prenotazioniCreate'
});

Booking.belongsTo(User, {
  foreignKey: 'creatoId',
  as: 'creatore'
});

User.hasMany(Booking, {
  foreignKey: 'processatoDa',
  as: 'prenotazioniProcessate'
});

Booking.belongsTo(User, {
  foreignKey: 'processatoDa',
  as: 'processatore'
});

// User - Notification associations
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifiche'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'utente'
});

// Booking - Notification associations
Booking.hasMany(Notification, {
  foreignKey: 'bookingId',
  as: 'notifiche'
});

Notification.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'prenotazione'
});

// User - AuditLog associations
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs'
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'utente'
});

module.exports = {
  User,
  Booking,
  Notification,
  AuditLog
}; 