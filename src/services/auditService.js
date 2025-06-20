const { AuditLog } = require('../models');

class AuditService {
  
  // Registra un'azione utente
  static async logAction(userId, azione, entita, descrizione, options = {}) {
    try {
      const auditData = {
        userId,
        azione,
        entita,
        descrizione,
        entitaId: options.entitaId || null,
        dettagliPrecedenti: options.dettagliPrecedenti || null,
        dettagliNuovi: options.dettagliNuovi || null,
        indirizzoIP: options.indirizzoIP || null,
        userAgent: options.userAgent || null
      };

      const audit = await AuditLog.create(auditData);
      console.log(`📝 Audit: ${audit.getDescrizioneCompleta()}`);
      
      return audit;
    } catch (error) {
      console.error('Errore logging audit:', error);
      // Non blocchiamo l'operazione principale se l'audit fallisce
    }
  }

  // Log creazione entità
  static async logCreation(userId, entita, entitaId, descrizione, nuoviDettagli, req = null) {
    return this.logAction(userId, 'CREAZIONE', entita, descrizione, {
      entitaId,
      dettagliNuovi: nuoviDettagli,
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Log modifica entità
  static async logUpdate(userId, entita, entitaId, descrizione, precedenti, nuovi, req = null) {
    return this.logAction(userId, 'MODIFICA', entita, descrizione, {
      entitaId,
      dettagliPrecedenti: precedenti,
      dettagliNuovi: nuovi,
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Log eliminazione entità
  static async logDeletion(userId, entita, entitaId, descrizione, dettagliEliminati, req = null) {
    return this.logAction(userId, 'ELIMINAZIONE', entita, descrizione, {
      entitaId,
      dettagliPrecedenti: dettagliEliminati,
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Log cambio stato
  static async logStatusChange(userId, entita, entitaId, descrizione, precedenti, nuovi, req = null) {
    return this.logAction(userId, 'CAMBIO_STATO', entita, descrizione, {
      entitaId,
      dettagliPrecedenti: precedenti,
      dettagliNuovi: nuovi,
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Log login
  static async logLogin(userId, req = null) {
    return this.logAction(userId, 'LOGIN', 'SISTEMA', 'Accesso effettuato', {
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Log logout
  static async logLogout(userId, req = null) {
    return this.logAction(userId, 'LOGOUT', 'SISTEMA', 'Disconnessione effettuata', {
      indirizzoIP: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  // Ottieni cronologia utente
  static async getUserHistory(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      azione = null,
      entita = null,
      startDate = null,
      endDate = null
    } = options;

    const where = { userId };
    
    if (azione) where.azione = azione;
    if (entita) where.entita = entita;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [{
        model: require('../models').User,
        as: 'utente',
        attributes: ['nome', 'cognome', 'email']
      }]
    });

    return {
      logs: rows,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / limit),
        count
      }
    };
  }

  // Ottieni statistiche attività utente
  static async getUserActivityStats(userId, days = 30) {
    const { Op } = require('sequelize');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalActions = await AuditLog.count({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      }
    });

    const actionsByType = await AuditLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'azione',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['azione'],
      raw: true
    });

    const entitiesByType = await AuditLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'entita',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['entita'],
      raw: true
    });

    // Attività giornaliera
    const dailyActivity = await AuditLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true
    });

    return {
      totalActions,
      period: `${days} giorni`,
      actionsByType: actionsByType.reduce((acc, curr) => {
        acc[curr.azione] = parseInt(curr.count);
        return acc;
      }, {}),
      entitiesByType: entitiesByType.reduce((acc, curr) => {
        acc[curr.entita] = parseInt(curr.count);
        return acc;
      }, {}),
      dailyActivity: dailyActivity.map(item => ({
        date: item.date,
        actions: parseInt(item.count)
      }))
    };
  }

  // Pulizia vecchi log (per maintenance)
  static async cleanOldLogs(daysToKeep = 365) {
    const { Op } = require('sequelize');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await AuditLog.destroy({
      where: {
        createdAt: { [Op.lte]: cutoffDate }
      }
    });

    console.log(`🧹 Eliminati ${deletedCount} log audit vecchi di più di ${daysToKeep} giorni`);
    return deletedCount;
  }
}

module.exports = AuditService; 