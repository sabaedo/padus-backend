const { Op } = require('sequelize');
const { User, Booking, Notification, AuditLog } = require('../models');
const AuditService = require('../services/auditService');
const csv = require('fast-csv');
const PDFDocument = require('pdfkit');

// @desc    Ottieni profilo personale completo
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Informazioni base utente
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Statistiche prenotazioni personali
    const totalBookings = await Booking.count({
      where: { creatoId: userId }
    });

    const bookingsByStatus = await Booking.findAll({
      where: { creatoId: userId },
      attributes: [
        'stato',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['stato'],
      raw: true
    });

    // Prenotazioni recenti (ultime 5)
    const recentBookings = await Booking.findAll({
      where: { creatoId: userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'nomeCliente', 'cognomeCliente', 'dataPrenotazione', 'stato', 'tipo', 'createdAt']
    });

    // Notifiche non lette
    const unreadNotifications = await Notification.count({
      where: {
        userId,
        letta: false
      }
    });

    // Statistiche attività (ultimi 30 giorni)
    const activityStats = await AuditService.getUserActivityStats(userId, 30);

    // Cronologia azioni recenti (ultime 10)
    const recentActivity = await AuditService.getUserHistory(userId, {
      limit: 10,
      page: 1
    });

    // Performance mensile
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyBookings = await Booking.count({
      where: {
        creatoId: userId,
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    const monthlyConfirmed = await Booking.count({
      where: {
        creatoId: userId,
        createdAt: { [Op.gte]: thisMonth },
        stato: 'CONFERMATA'
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          permessiDettaglio: user.getPermessiDettaglio()
        },
        statistics: {
          totalBookings,
          monthlyBookings,
          monthlyConfirmed,
          confirmationRate: monthlyBookings > 0 ? ((monthlyConfirmed / monthlyBookings) * 100).toFixed(1) : 0,
          unreadNotifications,
          bookingsByStatus: bookingsByStatus.reduce((acc, curr) => {
            acc[curr.stato] = parseInt(curr.count);
            return acc;
          }, {})
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          cliente: `${booking.nomeCliente} ${booking.cognomeCliente}`,
          data: booking.dataPrenotazione,
          stato: booking.stato,
          tipo: booking.tipo,
          createdAt: booking.createdAt
        })),
        activity: {
          ...activityStats,
          recentActions: recentActivity.logs.map(log => ({
            id: log.id,
            azione: log.azione,
            entita: log.entita,
            descrizione: log.descrizione,
            data: log.createdAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('Errore profilo personale:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni cronologia completa azioni personali
// @route   GET /api/profile/my-activity
// @access  Private
const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      azione, 
      entita, 
      startDate, 
      endDate 
    } = req.query;

    const history = await AuditService.getUserHistory(userId, {
      page,
      limit,
      azione,
      entita,
      startDate,
      endDate
    });

    const activities = history.logs.map(log => ({
      id: log.id,
      azione: log.azione,
      entita: log.entita,
      entitaId: log.entitaId,
      descrizione: log.descrizione,
      data: log.createdAt,
      ip: log.indirizzoIP,
      dettagliModifica: log.getDettagliModifica()
    }));

    res.json({
      success: true,
      data: {
        activities,
        pagination: history.pagination
      }
    });

  } catch (error) {
    console.error('Errore cronologia attività:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni cronologia prenotazioni personali
// @route   GET /api/profile/my-bookings
// @access  Private
const getMyBookingsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      stato, 
      tipo, 
      startDate, 
      endDate 
    } = req.query;

    const where = { creatoId: userId };
    
    if (stato) where.stato = stato;
    if (tipo) where.tipo = tipo;
    
    if (startDate || endDate) {
      where.dataPrenotazione = {};
      if (startDate) where.dataPrenotazione[Op.gte] = startDate;
      if (endDate) where.dataPrenotazione[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'processatore',
        attributes: ['nome', 'cognome']
      }],
      order: [['dataPrenotazione', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const bookings = rows.map(booking => ({
      ...booking.getDettagliPrenotazione(),
      processedBy: booking.processatore 
        ? `${booking.processatore.nome} ${booking.processatore.cognome}` 
        : null,
      allegatiCount: booking.allegati 
        ? JSON.parse(booking.allegati).length 
        : 0
    }));

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(count / limit),
          count
        }
      }
    });

  } catch (error) {
    console.error('Errore cronologia prenotazioni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Esporta cronologia personale in CSV
// @route   GET /api/profile/export/my-history/csv
// @access  Private
const exportMyHistoryCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Ottieni tutte le prenotazioni dell'utente
    const where = { creatoId: userId };
    if (startDate || endDate) {
      where.dataPrenotazione = {};
      if (startDate) where.dataPrenotazione[Op.gte] = startDate;
      if (endDate) where.dataPrenotazione[Op.lte] = endDate;
    }

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: User,
        as: 'processatore',
        attributes: ['nome', 'cognome']
      }],
      order: [['dataPrenotazione', 'DESC']]
    });

    // Prepara dati per CSV
    const csvData = bookings.map(booking => ({
      'ID Prenotazione': booking.id,
      'Tipo': booking.tipo,
      'Cliente': `${booking.nomeCliente} ${booking.cognomeCliente}`,
      'Email Cliente': booking.emailCliente,
      'Telefono Cliente': booking.telefonoCliente,
      'Data Prenotazione': booking.dataPrenotazione,
      'Orario': booking.orarioArrivo,
      'Persone': booking.numeroPersone,
      'Allergie': booking.allergie || 'Nessuna',
      'Note': booking.note || 'Nessuna',
      'Stato': booking.stato,
      'Processato Da': booking.processatore 
        ? `${booking.processatore.nome} ${booking.processatore.cognome}` 
        : 'Non processato',
      'Data Creazione': booking.createdAt.toISOString().split('T')[0],
      'Allegati': booking.allegati ? JSON.parse(booking.allegati).length : 0
    }));

    const fields = [
      'ID Prenotazione', 'Tipo', 'Cliente', 'Email Cliente', 'Telefono Cliente',
      'Data Prenotazione', 'Orario', 'Persone', 'Allergie', 'Note', 'Stato',
      'Processato Da', 'Data Creazione', 'Allegati'
    ];

    const filename = `cronologia_${req.user.nome}_${req.user.cognome}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.write('\uFEFF'); // BOM per Excel
    
    csv.writeToString(csvData, { 
      headers: true, 
      delimiter: ';' 
    }, (err, data) => {
      if (err) throw err;
      res.end(data);
    });

  } catch (error) {
    console.error('Errore esportazione cronologia CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esportazione'
    });
  }
};

// @desc    Esporta cronologia personale in PDF
// @route   GET /api/profile/export/my-history/pdf
// @access  Private
const exportMyHistoryPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Ottieni dati utente
    const user = await User.findByPk(userId, {
      attributes: ['nome', 'cognome', 'email', 'permessi']
    });

    // Ottieni prenotazioni
    const where = { creatoId: userId };
    if (startDate || endDate) {
      where.dataPrenotazione = {};
      if (startDate) where.dataPrenotazione[Op.gte] = startDate;
      if (endDate) where.dataPrenotazione[Op.lte] = endDate;
    }

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: User,
        as: 'processatore',
        attributes: ['nome', 'cognome']
      }],
      order: [['dataPrenotazione', 'DESC']]
    });

    // Statistiche personali
    const stats = {
      totali: bookings.length,
      confermate: bookings.filter(b => b.stato === 'CONFERMATA').length,
      inAttesa: bookings.filter(b => b.stato === 'IN_ATTESA').length,
      rifiutate: bookings.filter(b => b.stato === 'RIFIUTATA').length,
      normali: bookings.filter(b => b.tipo === 'NORMALE').length,
      eventi: bookings.filter(b => b.tipo === 'EVENTO').length
    };

    // Crea documento PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    // Header
    doc.fontSize(18).text('PADUS - Cronologia Personale Prenotazioni', { align: 'center' });
    doc.moveDown();
    
    // Info utente
    doc.fontSize(12).text(`Staff: ${user.nome} ${user.cognome}`, { align: 'left' });
    doc.text(`Email: ${user.email}`);
    doc.text(`Permessi: ${user.permessi}`);
    doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`);
    doc.text(`Periodo: ${startDate || 'Inizio'} - ${endDate || 'Fine'}`);
    doc.moveDown();

    // Statistiche
    doc.fontSize(14).text('Le Tue Statistiche:', { underline: true });
    doc.fontSize(10);
    doc.text(`• Prenotazioni totali: ${stats.totali}`);
    doc.text(`• Confermate: ${stats.confermate} (${((stats.confermate/stats.totali)*100 || 0).toFixed(1)}%)`);
    doc.text(`• In attesa: ${stats.inAttesa}`);
    doc.text(`• Rifiutate: ${stats.rifiutate}`);
    doc.text(`• Prenotazioni normali: ${stats.normali}`);
    doc.text(`• Eventi organizzati: ${stats.eventi}`);
    doc.moveDown();

    // Lista prenotazioni
    doc.fontSize(14).text('Dettaglio Prenotazioni:', { underline: true });
    doc.moveDown(0.5);

    bookings.forEach((booking, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10);
      doc.text(`${index + 1}. ${booking.nomeCliente} ${booking.cognomeCliente}`, { continued: true });
      doc.text(` - ${booking.dataPrenotazione} ${booking.orarioArrivo}`, { align: 'right' });
      
      doc.fontSize(8);
      doc.text(`   Tipo: ${booking.tipo} | Stato: ${booking.stato} | Persone: ${booking.numeroPersone}`);
      
      if (booking.processatore) {
        doc.text(`   Processato da: ${booking.processatore.nome} ${booking.processatore.cognome}`);
      }
      
      if (booking.allergie) {
        doc.text(`   Allergie: ${booking.allergie}`);
      }
      
      if (booking.note) {
        doc.text(`   Note: ${booking.note.substring(0, 100)}${booking.note.length > 100 ? '...' : ''}`);
      }
      
      doc.moveDown(0.3);
    });

    // Footer
    doc.fontSize(8).text(`Report generato il ${new Date().toLocaleString('it-IT')}`, 
      50, doc.page.height - 50, { align: 'center' });

    const filename = `cronologia_${user.nome}_${user.cognome}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Errore esportazione cronologia PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esportazione'
    });
  }
};

module.exports = {
  getMyProfile,
  getMyActivity,
  getMyBookingsHistory,
  exportMyHistoryCSV,
  exportMyHistoryPDF
}; 