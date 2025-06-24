const { Op } = require('sequelize');
const { User, Booking, Notification } = require('../models');
const notificationService = require('../services/notificationService');

// @desc    Ottieni lista utenti staff
// @route   GET /api/admin/users
// @access  Private (Admin)
const getStaffUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { cognome: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        users: rows.map(user => ({
          ...user.toJSON(),
          permessiDettaglio: user.getPermessiDettaglio()
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(count / limit),
          count
        }
      }
    });

  } catch (error) {
    console.error('Errore recupero utenti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Aggiorna permessi utente
// @route   PATCH /api/admin/users/:id/permissions
// @access  Private (Admin)
const updateUserPermissions = async (req, res) => {
  try {
    const { permessi } = req.body;
    const userId = req.params.id;

    if (!['BASE', 'AUTORIZZATO', 'ADMIN_SECONDARIO'].includes(permessi)) {
      return res.status(400).json({
        success: false,
        message: 'Permessi non validi'
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.ruolo === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Non puoi modificare i permessi di un amministratore'
      });
    }

    const oldPermissions = user.permessi;
    await user.update({ permessi });

    // Invia notifica all'utente
    await notificationService.notifySystem(
      'Permessi aggiornati',
      `I tuoi permessi sono stati aggiornati da ${oldPermissions} a ${permessi}`,
      [userId],
      'MEDIA'
    );

    res.json({
      success: true,
      message: 'Permessi aggiornati con successo',
      data: {
        id: user.id,
        nome: user.getNomeCompleto(),
        permessi: user.permessi,
        permessiDettaglio: user.getPermessiDettaglio()
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento permessi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Attiva/Disattiva utente
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { attivo } = req.body;
    const userId = req.params.id;

    if (typeof attivo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Il campo attivo deve essere true o false'
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.ruolo === 'ADMIN' && user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi disattivare il tuo stesso account'
      });
    }

    await user.update({ attivo });

    // Invia notifica all'utente se viene riattivato
    if (attivo) {
      await notificationService.notifySystem(
        'Account riattivato',
        'Il tuo account è stato riattivato dall\'amministratore',
        [userId],
        'MEDIA'
      );
    }

    res.json({
      success: true,
      message: `Utente ${attivo ? 'attivato' : 'disattivato'} con successo`,
      data: {
        id: user.id,
        nome: user.getNomeCompleto(),
        attivo: user.attivo
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento stato utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni dettagli utente
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Statistiche dettagliate
    const totalBookings = await Booking.count({
      where: { creatoId: user.id }
    });

    const bookingsByStatus = await Booking.findAll({
      where: { creatoId: user.id },
      attributes: [
        'stato',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['stato'],
      raw: true
    });

    const recentBookings = await Booking.findAll({
      where: { creatoId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'nomeCliente', 'cognomeCliente', 'dataPrenotazione', 'stato', 'createdAt']
    });

    const notifications = await Notification.count({
      where: { userId: user.id, letta: false }
    });

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          permessiDettaglio: user.getPermessiDettaglio()
        },
        stats: {
          totalBookings,
          bookingsByStatus: bookingsByStatus.reduce((acc, curr) => {
            acc[curr.stato] = parseInt(curr.count);
            return acc;
          }, {}),
          unreadNotifications: notifications
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          cliente: `${booking.nomeCliente} ${booking.cognomeCliente}`,
          data: booking.dataPrenotazione,
          stato: booking.stato,
          createdAt: booking.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Errore dettagli utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Dashboard statistiche admin
// @route   GET /api/admin/dashboard
// @access  Private (Admin/Admin Secondario)
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Statistiche generali
    const totalUsers = await User.count({ where: { ruolo: 'STAFF' } });
    const activeUsers = await User.count({ where: { ruolo: 'STAFF', attivo: true } });
    
    const totalBookings = await Booking.count();
    const pendingBookings = await Booking.count({ where: { stato: 'IN_ATTESA' } });
    const confirmedBookings = await Booking.count({ where: { stato: 'CONFERMATA' } });
    
    // Prenotazioni per questo mese
    const monthlyBookings = await Booking.count({
      where: {
        dataPrenotazione: { [Op.gte]: startOfMonth }
      }
    });

    // Prenotazioni per oggi
    const todayBookings = await Booking.count({
      where: {
        dataPrenotazione: today.toISOString().split('T')[0]
      }
    });

    // Prenotazioni per tipologia
    const bookingsByType = await Booking.findAll({
      attributes: [
        'tipo',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['tipo'],
      raw: true
    });

    // Top staff per prenotazioni
    const topStaff = await User.findAll({
      where: { ruolo: 'STAFF' },
      attributes: [
        'id', 'nome', 'cognome',
        [require('sequelize').fn('COUNT', require('sequelize').col('prenotazioniCreate.id')), 'bookingCount']
      ],
      include: [{
        model: Booking,
        as: 'prenotazioniCreate',
        attributes: []
      }],
      group: ['User.id'],
      order: [[require('sequelize').literal('bookingCount'), 'DESC']],
      limit: 5,
      raw: true
    });

    // Recenti prenotazioni in attesa
    const recentPending = await Booking.findAll({
      where: { stato: 'IN_ATTESA' },
      include: [{
        model: User,
        as: 'creatore',
        attributes: ['nome', 'cognome']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          monthlyBookings,
          todayBookings
        },
        charts: {
          bookingsByType: bookingsByType.reduce((acc, curr) => {
            acc[curr.tipo] = parseInt(curr.count);
            return acc;
          }, {}),
          topStaff: topStaff.map(staff => ({
            name: `${staff.nome} ${staff.cognome}`,
            bookings: parseInt(staff.bookingCount) || 0
          }))
        },
        recentPending: recentPending.map(booking => ({
          id: booking.id,
          cliente: booking.getNomeCompletoCliente(),
          data: booking.dataPrenotazione,
          orario: booking.orarioArrivo,
          tipo: booking.tipo,
          createdBy: booking.creatore ? `${booking.creatore.nome} ${booking.creatore.cognome}` : 'N/A',
          createdAt: booking.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Errore dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  getStaffUsers,
  updateUserPermissions,
  updateUserStatus,
  getUserDetails,
  getDashboardStats
}; 