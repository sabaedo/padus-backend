// Backend Notification Service
class NotificationService {
  constructor() {
    this.io = null; // Socket.IO instance
  }

  // Inizializza con Socket.IO
  init(socketIo) {
    this.io = socketIo;
    console.log('🔔 Notification Service inizializzato');
  }

  // Invia notifica a specifici utenti
  async notifyUsers(userIds, title, message, type = 'info', data = {}) {
    if (!this.io) return;

    const notification = {
      title,
      message,
      type,
      timestamp: new Date(),
      data
    };

    userIds.forEach(userId => {
      this.io.to(`user_${userId}`).emit('notification', notification);
    });

    console.log(`📢 Notifica inviata a ${userIds.length} utenti: ${title}`);
  }

  // Notifica per nuova prenotazione
  async notifyNewBooking(booking) {
    const title = 'Nuova Prenotazione';
    const message = `${booking.nomeCliente} ${booking.cognomeCliente} - ${booking.dataPrenotazione}`;
    
    // Notifica agli admin e staff autorizzati
    const adminUsers = await this.getNotificationUsers(['ADMIN', 'ADMIN_SECONDARIO']);
    await this.notifyUsers(adminUsers, title, message, 'info', { bookingId: booking.id });
  }

  // Notifica per cambio stato prenotazione  
  async notifyBookingStatusChange(booking, oldStatus) {
    const title = 'Prenotazione Aggiornata';
    const message = `${booking.nomeCliente} ${booking.cognomeCliente}: ${oldStatus} → ${booking.stato}`;
    
    // Notifica al creatore della prenotazione
    await this.notifyUsers([booking.creatoId], title, message, 'info', { bookingId: booking.id });
  }

  // Notifica per prenotazione cancellata
  async notifyBookingCancelled(booking) {
    const title = 'Prenotazione Cancellata';
    const message = `${booking.nomeCliente} ${booking.cognomeCliente} - ${booking.dataPrenotazione}`;
    
    const adminUsers = await this.getNotificationUsers(['ADMIN', 'ADMIN_SECONDARIO']);
    await this.notifyUsers(adminUsers, title, message, 'warning', { bookingId: booking.id });
  }

  // Notifica di sistema
  async notifySystem(title, message, userIds = null, type = 'info') {
    if (!userIds) {
      // Notifica a tutti gli admin
      userIds = await this.getNotificationUsers(['ADMIN']);
    }
    
    await this.notifyUsers(userIds, title, message, type);
  }

  // Ottieni utenti per notifiche
  async getNotificationUsers(permissionLevels) {
    try {
      const { User } = require('../models');
      
      const users = await User.findAll({
        where: {
          permessi: permissionLevels,
          attivo: true,
          notificheAttive: true
        },
        attributes: ['id']
      });

      return users.map(user => user.id);
    } catch (error) {
      console.error('Errore recupero utenti notifiche:', error);
      return [];
    }
  }

  // Metodi di compatibilità per il frontend
  showSuccess(message) {
    console.log(`✅ SUCCESS: ${message}`);
  }

  showError(message) {
    console.log(`❌ ERROR: ${message}`);
  }

  showWarning(message) {
    console.log(`⚠️  WARNING: ${message}`);
  }

  showInfo(message) {
    console.log(`ℹ️  INFO: ${message}`);
  }
}

// Istanza singleton
const notificationService = new NotificationService();

module.exports = notificationService; 