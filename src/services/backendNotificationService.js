// Backend Notification Service (senza dipendenze frontend)

class NotificationService {
  constructor() {
    this.toastListeners = new Set();
  }

  // TOAST NOTIFICATIONS (per testing/log)
  showToast(message, type = 'info', duration = 5000) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      timestamp: new Date()
    };

    // Notifica tutti i listener
    this.toastListeners.forEach(callback => callback(toast));

    return toast.id;
  }

  removeToast(toastId) {
    this.toastListeners.forEach(callback => callback({ remove: toastId }));
  }

  // Aggiungi listener per toast
  addToastListener(callback) {
    this.toastListeners.add(callback);
    
    return () => {
      this.toastListeners.delete(callback);
    };
  }

  // Helper per tipi di notifica comuni
  showSuccess(message, duration = 3000) {
    return this.showToast(message, 'success', duration);
  }

  showError(message, duration = 5000) {
    return this.showToast(message, 'error', duration);
  }

  showWarning(message, duration = 4000) {
    return this.showToast(message, 'warning', duration);
  }

  showInfo(message, duration = 3000) {
    return this.showToast(message, 'info', duration);
  }

  // Metodi mock per compatibilità
  async getNotificationPreferences() {
    return {
      notificheAttive: true,
      preferenzeNotifiche: {
        prenotazioniNuove: true,
        prenotazioniModificate: true,
        prenotazioniCancellate: true,
        promemoria: true
      }
    };
  }

  async updateNotificationPreferences(preferences) {
    console.log('Aggiornamento preferenze:', preferences);
    this.showSuccess('Preferenze notifiche aggiornate');
    return { success: true, data: preferences };
  }
}

// Istanza singleton
const notificationService = new NotificationService();

module.exports = notificationService; 