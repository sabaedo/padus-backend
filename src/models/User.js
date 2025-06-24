const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  cognome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  ruolo: {
    type: DataTypes.ENUM('STAFF', 'ADMIN'),
    allowNull: false,
    defaultValue: 'STAFF'
  },
  permessi: {
    type: DataTypes.ENUM('BASE', 'AUTORIZZATO', 'ADMIN_SECONDARIO', 'AMMINISTRATORE'),
    allowNull: false,
    defaultValue: 'BASE'
  },
  attivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimoAccesso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificheAttive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferenzeNotifiche: {
    type: DataTypes.JSON,
    defaultValue: {
      prenotazioniNuove: true,
      prenotazioniModificate: true,
      prenotazioniCancellate: true,
      promemoria: true
    }
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
      
      // Assegnazione automatica permessi in base al ruolo
      if (user.ruolo === 'ADMIN') {
        user.permessi = 'AMMINISTRATORE';
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Metodi istanza
User.prototype.checkPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getPermessiDettaglio = function() {
  const permessiMapping = {
    'BASE': {
      creaPrenotazioni: true,
      autoApprovazione: false,
      gestioneAltrui: false,
      visualizzaDashboard: false,
      modificaPermessi: false
    },
    'AUTORIZZATO': {
      creaPrenotazioni: true,
      autoApprovazione: true,
      gestioneAltrui: false,
      visualizzaDashboard: false,
      modificaPermessi: false
    },
    'ADMIN_SECONDARIO': {
      creaPrenotazioni: true,
      autoApprovazione: true,
      gestioneAltrui: true,
      visualizzaDashboard: true,
      modificaPermessi: false
    },
    'AMMINISTRATORE': {
      creaPrenotazioni: true,
      autoApprovazione: true,
      gestioneAltrui: true,
      visualizzaDashboard: true,
      modificaPermessi: true
    }
  };
  
  return permessiMapping[this.permessi] || permessiMapping['BASE'];
};

User.prototype.getNomeCompleto = function() {
  return `${this.nome} ${this.cognome}`;
};

module.exports = User; 