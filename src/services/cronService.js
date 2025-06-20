const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, Booking, Notification } = require('../models');
const notificationService = require('./notificationService');
const AuditService = require('./auditService');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  // Inizializza tutti i cron jobs
  init() {
    console.log('🕐 Inizializzazione Cron Jobs...');

    // Job 1: Promemoria prenotazioni del giorno (ogni giorno alle 8:00)
    this.scheduleJob('dailyReminders', '0 8 * * *', this.sendDailyReminders.bind(this));

    // Job 2: Notifica prenotazioni in attesa da troppo tempo (ogni ora)
    this.scheduleJob('pendingReminders', '0 * * * *', this.notifyPendingBookings.bind(this));

    // Job 3: Pulizia notifiche vecchie (ogni domenica alle 2:00)
    this.scheduleJob('cleanupNotifications', '0 2 * * 0', this.cleanupOldNotifications.bind(this));

    // Job 6: Pulizia log audit vecchi (ogni domenica alle 3:00)
    this.scheduleJob('cleanupAuditLogs', '0 3 * * 0', this.cleanupOldAuditLogs.bind(this));

    // Job 4: Report settimanale per admin (ogni lunedì alle 9:00)
    this.scheduleJob('weeklyReport', '0 9 * * 1', this.sendWeeklyReport.bind(this));

    // Job 5: Controllo prenotazioni scadute (ogni 6 ore)
    this.scheduleJob('expiredBookings', '0 */6 * * *', this.handleExpiredBookings.bind(this));

    console.log('✅ Cron Jobs inizializzati con successo');
  }

  // Programma un singolo job
  scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, task, {
        scheduled: false,
        timezone: 'Europe/Rome'
      });
      
      this.jobs.set(name, job);
      job.start();
      
      console.log(`✅ Job '${name}' programmato: ${schedule}`);
    } catch (error) {
      console.error(`❌ Errore programmazione job '${name}':`, error);
    }
  }

  // Job 1: Promemoria giornaliero
  async sendDailyReminders() {
    try {
      console.log('🔔 Eseguendo promemoria giornaliero...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Trova prenotazioni per oggi
      const todayBookings = await Booking.findAll({
        where: {
          dataPrenotazione: today,
          stato: 'CONFERMATA'
        },
        include: [{
          model: User,
          as: 'creatore',
          attributes: ['id', 'nome', 'cognome']
        }]
      });

      if (todayBookings.length > 0) {
        // Notifica agli admin
        const adminUsers = await User.findAll({
          where: {
            ruolo: { [Op.in]: ['ADMIN', 'STAFF'] },
            permessi: { [Op.in]: ['ADMIN_SECONDARIO', 'AMMINISTRATORE'] },
            attivo: true
          },
          attributes: ['id']
        });

        const adminIds = adminUsers.map(admin => admin.id);

        await notificationService.notifySystem(
          'Prenotazioni di oggi',
          `Ci sono ${todayBookings.length} prenotazioni confermate per oggi`,
          adminIds,
          'MEDIA',
          {
            type: 'DAILY_REMINDER',
            count: todayBookings.length,
            date: today
          }
        );

        console.log(`✅ Promemoria inviato per ${todayBookings.length} prenotazioni`);
      }

    } catch (error) {
      console.error('❌ Errore promemoria giornaliero:', error);
    }
  }

  // Job 2: Notifica prenotazioni in attesa da troppo tempo
  async notifyPendingBookings() {
    try {
      console.log('⏰ Controllo prenotazioni in attesa...');
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const pendingBookings = await Booking.findAll({
        where: {
          stato: 'IN_ATTESA',
          createdAt: { [Op.lte]: twoHoursAgo }
        },
        include: [{
          model: User,
          as: 'creatore',
          attributes: ['id', 'nome', 'cognome']
        }]
      });

      if (pendingBookings.length > 0) {
        // Notifica agli admin
        const adminUsers = await User.findAll({
          where: {
            ruolo: { [Op.in]: ['ADMIN', 'STAFF'] },
            permessi: { [Op.in]: ['ADMIN_SECONDARIO', 'AMMINISTRATORE'] },
            attivo: true
          },
          attributes: ['id']
        });

        const adminIds = adminUsers.map(admin => admin.id);

        for (const booking of pendingBookings) {
          await notificationService.notifySystem(
            'Prenotazione in attesa da troppo tempo',
            `La prenotazione #${booking.id} di ${booking.getNomeCompletoCliente()} è in attesa da più di 2 ore`,
            adminIds,
            'ALTA',
            {
              type: 'PENDING_REMINDER',
              bookingId: booking.id,
              clientName: booking.getNomeCompletoCliente(),
              waitTime: '2+ ore'
            }
          );
        }

        console.log(`⚠️ Notificate ${pendingBookings.length} prenotazioni in attesa`);
      }

    } catch (error) {
      console.error('❌ Errore controllo prenotazioni in attesa:', error);
    }
  }

  // Job 3: Pulizia notifiche vecchie
  async cleanupOldNotifications() {
    try {
      console.log('🧹 Pulizia notifiche vecchie...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await Notification.destroy({
        where: {
          createdAt: { [Op.lte]: thirtyDaysAgo },
          letta: true
        }
      });

      console.log(`🗑️ Eliminate ${deletedCount} notifiche vecchie`);

    } catch (error) {
      console.error('❌ Errore pulizia notifiche:', error);
    }
  }

  // Job 4: Report settimanale
  async sendWeeklyReport() {
    try {
      console.log('📊 Generando report settimanale...');
      
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Statistiche settimana
      const weeklyStats = {
        totalBookings: await Booking.count({
          where: { createdAt: { [Op.gte]: lastWeek } }
        }),
        confirmedBookings: await Booking.count({
          where: { 
            createdAt: { [Op.gte]: lastWeek },
            stato: 'CONFERMATA'
          }
        }),
        pendingBookings: await Booking.count({
          where: { 
            createdAt: { [Op.gte]: lastWeek },
            stato: 'IN_ATTESA'
          }
        }),
        cancelledBookings: await Booking.count({
          where: { 
            createdAt: { [Op.gte]: lastWeek },
            stato: 'CANCELLATA'
          }
        })
      };

      // Notifica agli admin
      const adminUsers = await User.findAll({
        where: {
          ruolo: 'ADMIN',
          attivo: true
        },
        attributes: ['id']
      });

      const adminIds = adminUsers.map(admin => admin.id);

      const reportMessage = `Report settimanale:
📈 Totale prenotazioni: ${weeklyStats.totalBookings}
✅ Confermate: ${weeklyStats.confirmedBookings}
⏳ In attesa: ${weeklyStats.pendingBookings}
❌ Cancellate: ${weeklyStats.cancelledBookings}`;

      await notificationService.notifySystem(
        'Report Settimanale',
        reportMessage,
        adminIds,
        'BASSA',
        {
          type: 'WEEKLY_REPORT',
          stats: weeklyStats,
          period: 'last_week'
        }
      );

      console.log('📈 Report settimanale inviato agli admin');

    } catch (error) {
      console.error('❌ Errore report settimanale:', error);
    }
  }

  // Job 5: Gestione prenotazioni scadute
  async handleExpiredBookings() {
    try {
      console.log('🕐 Controllo prenotazioni scadute...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Trova prenotazioni del giorno precedente ancora in attesa
      const expiredBookings = await Booking.findAll({
        where: {
          dataPrenotazione: yesterdayStr,
          stato: 'IN_ATTESA'
        }
      });

      if (expiredBookings.length > 0) {
        // Aggiorna stato a "SCADUTA" (se non esiste, mantieni IN_ATTESA)
        for (const booking of expiredBookings) {
          await booking.update({ 
            note: booking.note 
              ? `${booking.note}\n\n[SISTEMA] Prenotazione scaduta automaticamente` 
              : '[SISTEMA] Prenotazione scaduta automaticamente'
          });
        }

        // Notifica agli admin
        const adminUsers = await User.findAll({
          where: {
            ruolo: { [Op.in]: ['ADMIN', 'STAFF'] },
            permessi: { [Op.in]: ['ADMIN_SECONDARIO', 'AMMINISTRATORE'] },
            attivo: true
          },
          attributes: ['id']
        });

        const adminIds = adminUsers.map(admin => admin.id);

        await notificationService.notifySystem(
          'Prenotazioni scadute rilevate',
          `${expiredBookings.length} prenotazioni di ieri sono ancora in attesa di conferma`,
          adminIds,
          'MEDIA',
          {
            type: 'EXPIRED_BOOKINGS',
            count: expiredBookings.length,
            date: yesterdayStr
          }
        );

              console.log(`⚠️ Rilevate ${expiredBookings.length} prenotazioni scadute`);
    }

  } catch (error) {
    console.error('❌ Errore controllo prenotazioni scadute:', error);
  }
}

// Job 6: Pulizia vecchi log audit
async cleanupOldAuditLogs() {
  try {
    console.log('🧹 Pulizia log audit vecchi...');
    
    const deletedCount = await AuditService.cleanOldLogs(365); // Mantieni 1 anno
    
    console.log(`🗑️ Eliminati ${deletedCount} log audit vecchi`);

  } catch (error) {
    console.error('❌ Errore pulizia log audit:', error);
  }
}

  // Ferma tutti i jobs
  stopAll() {
    console.log('🛑 Fermando tutti i cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Job '${name}' fermato`);
    });
    this.jobs.clear();
  }

  // Ferma un job specifico
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`⏹️ Job '${name}' fermato`);
      return true;
    }
    return false;
  }

  // Ottieni stato dei jobs
  getJobsStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false
      };
    });
    return status;
  }
}

module.exports = new CronService(); 