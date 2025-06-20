const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  titolo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  messaggio: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM(
      'NUOVA_PRENOTAZIONE',
      'PRENOTAZIONE_MODIFICATA',
      'PRENOTAZIONE_CONFERMATA',
      'PRENOTAZIONE_RIFIUTATA',
      'PRENOTAZIONE_CANCELLATA',
      'PROMEMORIA',
      'SISTEMA'
    ),
    allowNull: false
  },
  priorita: {
    type: DataTypes.ENUM('BASSA', 'MEDIA', 'ALTA', 'URGENTE'),
    allowNull: false,
    defaultValue: 'MEDIA'
  },
  letta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dataLettura: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Dati collegati
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  
  // Metadati aggiuntivi per la notifica
  metadati: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  
  // URL di azione (opzionale)
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Scadenza notifica
  scadenza: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Utente destinatario della notifica
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'notifications'
});

// Metodi istanza
Notification.prototype.markAsRead = async function() {
  this.letta = true;
  this.dataLettura = new Date();
  return await this.save();
};

Notification.prototype.isScaduta = function() {
  return this.scadenza && new Date() > this.scadenza;
};

Notification.prototype.getIcona = function() {
  const iconeMap = {
    'NUOVA_PRENOTAZIONE': '📅',
    'PRENOTAZIONE_MODIFICATA': '✏️',
    'PRENOTAZIONE_CONFERMATA': '✅',
    'PRENOTAZIONE_RIFIUTATA': '❌',
    'PRENOTAZIONE_CANCELLATA': '🗑️',
    'PROMEMORIA': '⏰',
    'SISTEMA': '⚙️'
  };
  
  return iconeMap[this.tipo] || '📢';
};

Notification.prototype.getColore = function() {
  const coloriMap = {
    'BASSA': '#6B7280',
    'MEDIA': '#3B82F6',
    'ALTA': '#F59E0B',
    'URGENTE': '#EF4444'
  };
  
  return coloriMap[this.priorita] || '#6B7280';
};

module.exports = Notification; 