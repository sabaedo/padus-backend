const express = require('express');
const router = express.Router();

// Import controllers
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  updateNotificationPreferences
} = require('../controllers/notificationController');

// Import middleware
const { authenticate } = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Routes per notifiche
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// Routes per gestione stato notifiche
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);

// Routes per eliminazione notifiche
router.delete('/clear-read', clearReadNotifications);
router.delete('/:id', deleteNotification);

// Route per preferenze notifiche
router.put('/preferences', updateNotificationPreferences);

module.exports = router; 