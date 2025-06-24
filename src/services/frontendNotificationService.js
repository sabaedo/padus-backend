const api = require('./authService');

// URL del VAPID public key (da configurare)
const VAPID_PUBLIC_KEY = 'BJKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx';

class NotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.registration = null;
    this.subscription = null;
    this.toastListeners = new Set();
  }

  // Inizializza il service worker
  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications non supportate');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrato:', this.registration);
      
      await navigator.serviceWorker.ready;
      console.log('Service Worker pronto');
      
      return true;
    } catch (error) {
      console.error('Errore registrazione Service Worker:', error);
      return false;
    }
  }

  // Richiedi permessi notifiche
  async requestPermission() {
    if (!this.isSupported) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Sottoscrivi alle notifiche push
  async subscribe() {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) return null;

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Permessi notifiche negati');
      }

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Invia subscription al server
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Errore sottoscrizione push:', error);
      return null;
    }
  }

  // Annulla sottoscrizione
  async unsubscribe() {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer();
      this.subscription = null;
    }
  }

  // Invia subscription al backend
  async sendSubscriptionToServer(subscription) {
    try {
      await api.post('/notifications/subscribe', {
        subscription: subscription.toJSON()
      });
    } catch (error) {
      console.error('Errore invio subscription:', error);
    }
  }

  // Rimuovi subscription dal backend
  async removeSubscriptionFromServer() {
    try {
      await api.delete('/notifications/unsubscribe');
    } catch (error) {
      console.error('Errore rimozione subscription:', error);
    }
  }

  // Verifica stato subscription
  async getSubscriptionStatus() {
    if (!this.registration) return false;

    this.subscription = await this.registration.pushManager.getSubscription();
    return !!this.subscription;
  }

  // Utility per convertire VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // TOAST NOTIFICATIONS
  showToast(message, type = 'info', duration = 5000) {
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type, // success, error, warning, info
      duration,
      timestamp: new Date()
    };

    // Notifica tutti i listener
    this.toastListeners.forEach(callback => callback(toast));

    // Auto remove toast
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }

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

  // NOTIFICHE LOCALI
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      this.showToast(`${title}: ${options.body || ''}`, 'info');
      return;
    }

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    });

    // Auto close dopo 5 secondi
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // API per gestire notifiche dal backend
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
      return { notifications: [], total: 0 };
    }
  }

  async markAsRead(notificationId) {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error);
      return false;
    }
  }

  async markAllAsRead() {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (error) {
      console.error('Errore aggiornamento notifiche:', error);
      return false;
    }
  }

  async deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return true;
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
      return false;
    }
  }

  // GESTIONE PREFERENZE NOTIFICHE
  async getNotificationPreferences() {
    try {
      const response = await api.get('/auth/me'); // Ottieni dati utente con preferenze
      return {
        notificheAttive: response.data.data.notificheAttive,
        preferenzeNotifiche: response.data.data.preferenzeNotifiche
      };
    } catch (error) {
      console.error('Errore caricamento preferenze:', error);
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
  }

  async updateNotificationPreferences(preferences) {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      this.showSuccess('Preferenze notifiche aggiornate');
      return response.data;
    } catch (error) {
      console.error('Errore aggiornamento preferenze:', error);
      this.showError('Errore nel salvataggio delle preferenze');
      return false;
    }
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
}

// Istanza singleton
const notificationService = new NotificationService();

export default notificationService; 