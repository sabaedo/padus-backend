const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  azione: {
    type: DataTypes.ENUM('CREAZIONE', 'MODIFICA', 'ELIMINAZIONE', 'LOGIN', 'LOGOUT', 'CAMBIO_STATO'),
    allowNull: false
  },
  entita: {
    type: DataTypes.ENUM('PRENOTAZIONE', 'UTENTE', 'NOTIFICA', 'SISTEMA'),
    allowNull: false
  },
  entitaId: {
    type: DataTypes.UUID,
    allowNull: true // Null per azioni di sistema
  },
  descrizione: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dettagliPrecedenti: {
    type: DataTypes.JSONB,
    allowNull: true // Dati prima della modifica
  },
  dettagliNuovi: {
    type: DataTypes.JSONB,
    allowNull: true // Dati dopo la modifica
  },
  indirizzoIP: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['azione', 'entita']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Metodi istanza
AuditLog.prototype.getDescrizioneCompleta = function() {
  const timeStr = this.createdAt.toLocaleString('it-IT');
  return `${timeStr}: ${this.descrizione}`;
};

AuditLog.prototype.getDettagliModifica = function() {
  if (!this.dettagliPrecedenti || !this.dettagliNuovi) {
    return null;
  }
  
  const precedenti = this.dettagliPrecedenti;
  const nuovi = this.dettagliNuovi;
  const modifiche = [];
  
  for (const [key, nuovoValore] of Object.entries(nuovi)) {
    const vecchioValore = precedenti[key];
    if (vecchioValore !== nuovoValore) {
      modifiche.push({
        campo: key,
        prima: vecchioValore,
        dopo: nuovoValore
      });
    }
  }
  
  return modifiche;
};

module.exports = AuditLog; 