const { Op } = require('sequelize');
const { User, Booking, Notification } = require('../models');
const csv = require('fast-csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Esporta prenotazioni in CSV
// @route   GET /api/stats/export/bookings/csv
// @access  Private (Admin/Admin Secondario)
const exportBookingsCSV = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      stato, 
      tipo, 
      createdBy 
    } = req.query;

    // Costruisci filtri
    const where = {};
    if (startDate) where.dataPrenotazione = { [Op.gte]: startDate };
    if (endDate) {
      where.dataPrenotazione = where.dataPrenotazione 
        ? { ...where.dataPrenotazione, [Op.lte]: endDate }
        : { [Op.lte]: endDate };
    }
    if (stato) where.stato = stato;
    if (tipo) where.tipo = tipo;
    if (createdBy) where.creatoId = createdBy;

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: User,
        as: 'creatore',
        attributes: ['nome', 'cognome', 'email']
      }],
      order: [['dataPrenotazione', 'DESC']]
    });

    // Prepara dati per CSV
    const csvData = bookings.map(booking => ({
      'ID': booking.id,
      'Tipo': booking.tipo,
      'Cliente Nome': booking.nomeCliente,
      'Cliente Cognome': booking.cognomeCliente,
      'Email': booking.emailCliente,
      'Telefono': booking.telefonoCliente,
      'Data Prenotazione': booking.dataPrenotazione,
      'Orario Arrivo': booking.orarioArrivo,
      'Numero Persone': booking.numeroPersone,
      'Allergie': booking.allergie || 'Nessuna',
      'Note': booking.note || 'Nessuna',
      'Stato': booking.stato,
      'Creato Da': booking.creatore ? `${booking.creatore.nome} ${booking.creatore.cognome}` : 'N/A',
      'Data Creazione': booking.createdAt.toISOString().split('T')[0],
      'Ultima Modifica': booking.updatedAt.toISOString().split('T')[0]
    }));

    // Configurazione CSV
    const fields = [
      'ID', 'Tipo', 'Cliente Nome', 'Cliente Cognome', 'Email', 'Telefono',
      'Data Prenotazione', 'Orario Arrivo', 'Numero Persone', 'Allergie', 
      'Note', 'Stato', 'Creato Da', 'Data Creazione', 'Ultima Modifica'
    ];

    const filename = `prenotazioni_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.write('\uFEFF'); // BOM per Excel
    
    // Usa fast-csv per generare il CSV
    csv.writeToString(csvData, { 
      headers: true, 
      delimiter: ';' 
    }, (err, data) => {
      if (err) throw err;
      res.end(data);
    });

  } catch (error) {
    console.error('Errore esportazione CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esportazione'
    });
  }
};

// @desc    Esporta prenotazioni in PDF
// @route   GET /api/stats/export/bookings/pdf
// @access  Private (Admin/Admin Secondario)
const exportBookingsPDF = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      stato, 
      tipo, 
      createdBy 
    } = req.query;

    // Costruisci filtri
    const where = {};
    if (startDate) where.dataPrenotazione = { [Op.gte]: startDate };
    if (endDate) {
      where.dataPrenotazione = where.dataPrenotazione 
        ? { ...where.dataPrenotazione, [Op.lte]: endDate }
        : { [Op.lte]: endDate };
    }
    if (stato) where.stato = stato;
    if (tipo) where.tipo = tipo;
    if (createdBy) where.creatoId = createdBy;

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: User,
        as: 'creatore',
        attributes: ['nome', 'cognome']
      }],
      order: [['dataPrenotazione', 'DESC']]
    });

    // Crea documento PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    // Header del documento
    doc.fontSize(20).text('PADUS - Report Prenotazioni', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`);
    doc.text(`Periodo: ${startDate || 'Inizio'} - ${endDate || 'Fine'}`);
    doc.text(`Totale prenotazioni: ${bookings.length}`);
    doc.moveDown();

    // Statistiche generali
    const stats = {
      confermati: bookings.filter(b => b.stato === 'CONFERMATA').length,
      inAttesa: bookings.filter(b => b.stato === 'IN_ATTESA').length,
      cancellati: bookings.filter(b => b.stato === 'CANCELLATA').length,
      normali: bookings.filter(b => b.tipo === 'NORMALE').length,
      eventi: bookings.filter(b => b.tipo === 'EVENTO').length
    };

    doc.fontSize(14).text('Statistiche:', { underline: true });
    doc.fontSize(10);
    doc.text(`• Prenotazioni confermate: ${stats.confermati}`);
    doc.text(`• Prenotazioni in attesa: ${stats.inAttesa}`);
    doc.text(`• Prenotazioni cancellate: ${stats.cancellati}`);
    doc.text(`• Prenotazioni normali: ${stats.normali}`);
    doc.text(`• Eventi: ${stats.eventi}`);
    doc.moveDown();

    // Lista prenotazioni
    doc.fontSize(14).text('Dettaglio Prenotazioni:', { underline: true });
    doc.moveDown(0.5);

    bookings.forEach((booking, index) => {
      // Controlla se serve una nuova pagina
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10);
      doc.text(`${index + 1}. ${booking.nomeCliente} ${booking.cognomeCliente}`, { continued: true });
      doc.text(` - ${booking.dataPrenotazione} ${booking.orarioArrivo}`, { align: 'right' });
      
      doc.fontSize(8);
      doc.text(`   Tipo: ${booking.tipo} | Stato: ${booking.stato} | Persone: ${booking.numeroPersone}`);
      doc.text(`   Email: ${booking.emailCliente} | Tel: ${booking.telefonoCliente}`);
      
      if (booking.allergie) {
        doc.text(`   Allergie: ${booking.allergie}`);
      }
      
      if (booking.note) {
        doc.text(`   Note: ${booking.note}`);
      }
      
      doc.text(`   Creato da: ${booking.creatore ? `${booking.creatore.nome} ${booking.creatore.cognome}` : 'N/A'}`);
      doc.moveDown(0.3);
    });

    // Footer
    doc.fontSize(8).text(`Report generato il ${new Date().toLocaleString('it-IT')}`, 
      50, doc.page.height - 50, { align: 'center' });

    const filename = `prenotazioni_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Errore esportazione PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esportazione'
    });
  }
};

// @desc    Statistiche generali per dashboard
// @route   GET /api/stats/overview
// @access  Private (Admin/Admin Secondario)
const getStatsOverview = async (req, res) => {
  try {
    const { period = '30' } = req.query; // giorni
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Statistiche generali
    const totalBookings = await Booking.count();
    const recentBookings = await Booking.count({
      where: { createdAt: { [Op.gte]: startDate } }
    });

    const bookingsByStatus = await Booking.findAll({
      attributes: [
        'stato',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['stato'],
      raw: true
    });

    const bookingsByType = await Booking.findAll({
      attributes: [
        'tipo',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['tipo'],
      raw: true
    });

    // Trend mensile
    const monthlyTrend = await Booking.findAll({
      attributes: [
        [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('dataPrenotazione')), 'month'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        dataPrenotazione: { [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      },
      group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('dataPrenotazione'))],
      order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('dataPrenotazione')), 'ASC']],
      raw: true
    });

    // Top allergie
    const allergieFrequenti = await Booking.findAll({
      where: {
        allergie: { [Op.not]: null },
        allergie: { [Op.ne]: '' }
      },
      attributes: ['allergie'],
      raw: true
    });

    const allergieCount = {};
    allergieFrequenti.forEach(booking => {
      if (booking.allergie) {
        const allergie = booking.allergie.toLowerCase().split(',').map(a => a.trim());
        allergie.forEach(allergia => {
          allergieCount[allergia] = (allergieCount[allergia] || 0) + 1;
        });
      }
    });

    const topAllergie = Object.entries(allergieCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([allergia, count]) => ({ allergia, count }));

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          recentBookings,
          period: parseInt(period)
        },
        charts: {
          bookingsByStatus: bookingsByStatus.reduce((acc, curr) => {
            acc[curr.stato] = parseInt(curr.count);
            return acc;
          }, {}),
          bookingsByType: bookingsByType.reduce((acc, curr) => {
            acc[curr.tipo] = parseInt(curr.count);
            return acc;
          }, {}),
          monthlyTrend: monthlyTrend.map(item => ({
            month: item.month,
            count: parseInt(item.count)
          })),
          topAllergie
        }
      }
    });

  } catch (error) {
    console.error('Errore statistiche overview:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Statistiche utenti staff
// @route   GET /api/stats/staff
// @access  Private (Admin)
const getStaffStats = async (req, res) => {
  try {
    const staffUsers = await User.findAll({
      where: { ruolo: 'STAFF' },
      attributes: [
        'id', 'nome', 'cognome', 'email', 'permessi', 'attivo', 'createdAt',
        [require('sequelize').fn('COUNT', require('sequelize').col('prenotazioniCreate.id')), 'totalBookings']
      ],
      include: [{
        model: Booking,
        as: 'prenotazioniCreate',
        attributes: []
      }],
      group: ['User.id'],
      order: [[require('sequelize').literal('totalBookings'), 'DESC']]
    });

    // Statistiche per permessi
    const permessiStats = await User.findAll({
      where: { ruolo: 'STAFF' },
      attributes: [
        'permessi',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['permessi'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        staff: staffUsers.map(user => ({
          ...user.toJSON(),
          totalBookings: parseInt(user.dataValues.totalBookings) || 0
        })),
        permessiDistribution: permessiStats.reduce((acc, curr) => {
          acc[curr.permessi] = parseInt(curr.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Errore statistiche staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  exportBookingsCSV,
  exportBookingsPDF,
  getStatsOverview,
  getStaffStats
}; 