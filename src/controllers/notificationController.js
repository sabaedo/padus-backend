const { Op } = require('sequelize');
const { Notification, Booking, User } = require('../models');

// @desc    Ottieni notifiche dell'utente
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      tipo, 
      letta,
      priorita 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };
    
    // Filtri opzionali
    if (tipo) where.tipo = tipo;
    if (letta !== undefined) where.letta = letta === 'true';
    if (priorita) where.priorita = priorita;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: Booking,
          as: 'prenotazione',
          attributes: ['id', 'nomeCliente', 'cognomeCliente', 'dataPrenotazione', 'stato'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Formatta notifiche per il frontend
    const notifications = rows.map(notification => ({
      id: notification.id,
      titolo: notification.titolo,
      messaggio: notification.messaggio,
      tipo: notification.tipo,
      priorita: notification.priorita,
      letta: notification.letta,
      dataLettura: notification.dataLettura,
      icona: notification.getIcona(),
      colore: notification.getColore(),
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
      booking: notification.prenotazione ? {
        id: notification.prenotazione.id,
        cliente: `${notification.prenotazione.nomeCliente} ${notification.prenotazione.cognomeCliente}`,
        data: notification.prenotazione.dataPrenotazione,
        stato: notification.prenotazione.stato
      } : null
    }));

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(count / limit),
          count,
          unreadCount: await Notification.count({
            where: { userId: req.user.id, letta: false }
          })
        }
      }
    });

  } catch (error) {
    console.error('Errore recupero notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni conteggio notifiche non lette
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { 
        userId: req.user.id, 
        letta: false 
      }
    });

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Errore conteggio notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Segna notifica come letta
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    if (!notification.letta) {
      await notification.markAsRead();
    }

    res.json({
      success: true,
      message: 'Notifica segnata come letta',
      data: {
        id: notification.id,
        letta: notification.letta,
        dataLettura: notification.dataLettura
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento notifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Segna tutte le notifiche come lette
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      { 
        letta: true, 
        dataLettura: new Date() 
      },
      {
        where: { 
          userId: req.user.id, 
          letta: false 
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} notifiche segnate come lette`,
      data: { updatedCount }
    });

  } catch (error) {
    console.error('Errore aggiornamento notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Elimina notifica
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notifica eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione notifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Elimina tutte le notifiche lette
// @route   DELETE /api/notifications/clear-read
// @access  Private
const clearReadNotifications = async (req, res) => {
  try {
    const deletedCount = await Notification.destroy({
      where: { 
        userId: req.user.id, 
        letta: true 
      }
    });

    res.json({
      success: true,
      message: `${deletedCount} notifiche lette eliminate`,
      data: { deletedCount }
    });

  } catch (error) {
    console.error('Errore pulizia notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Aggiorna preferenze notifiche
// @route   PUT /api/notifications/preferences
// @access  Private
const updateNotificationPreferences = async (req, res) => {
  try {
    const { notificheAttive, preferenzeNotifiche } = req.body;

    const updateData = {};
    if (typeof notificheAttive === 'boolean') {
      updateData.notificheAttive = notificheAttive;
    }
    if (preferenzeNotifiche) {
      updateData.preferenzeNotifiche = {
        ...req.user.preferenzeNotifiche,
        ...preferenzeNotifiche
      };
    }

    await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Preferenze notifiche aggiornate',
      data: {
        notificheAttive: req.user.notificheAttive,
        preferenzeNotifiche: req.user.preferenzeNotifiche
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento preferenze:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  updateNotificationPreferences
}; 