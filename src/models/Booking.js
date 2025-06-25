const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Tipo prenotazione
  tipo: {
    type: DataTypes.ENUM('NORMALE', 'EVENTO'),
    allowNull: false,
    defaultValue: 'NORMALE'
  },
  
  // Dati cliente comuni
  nomeCliente: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  cognomeCliente: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[+]?[\d\s\-\(\)]{8,20}$/
    }
  },
  
  // Data e ora prenotazione
  dataPrenotazione: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  orarioArrivo: {
    type: DataTypes.TIME,
    allowNull: false
  },
  
  // Dati prenotazione normale
  numeroPersone: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 200
    }
  },
  numeroAdulti: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 200
    }
  },
  numeroRagazzi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  numeroBambini: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  numeroNeonati: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Dati evento
  nomeEvento: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [3, 200]
    }
  },
  numeroPartecipanti: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 500
    }
  },
  tipoMenu: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [3, 100]
    }
  },
  allergie: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pacchetto: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [3, 200]
    }
  },
  
  // Area/sala prenotazione
  sala: {
    type: DataTypes.ENUM(
      'SALA_BAR',
      'SALA_BAR_RISERVATA',
      'SALA_VETRI',
      'SALA_VETRI_RISERVATA',
      'ESTERNO',
      'PISCINA',
      'TOOCOOL'
    ),
    allowNull: true
  },
  
  // Stato prenotazione
  stato: {
    type: DataTypes.ENUM('IN_ATTESA', 'CONFERMATA', 'RIFIUTATA'),
    allowNull: false,
    defaultValue: 'IN_ATTESA'
  },
  
  // Note aggiuntive
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Motivo rifiuto (se applicabile)
  motivoRifiuto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Allegati
  allegati: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  
  // Audit fields
  creatoIl: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modificatoIl: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // Chi ha processato la prenotazione
  processatoDa: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  dataProcessamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Chi ha creato la prenotazione
  creatoId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'bookings',
  hooks: {
    beforeUpdate: (booking) => {
      booking.modificatoIl = new Date();
    }
  }
});

// Metodi istanza
Booking.prototype.getNomeCompletoCliente = function() {
  return `${this.nomeCliente} ${this.cognomeCliente}`;
};

Booking.prototype.getNumeroTotalePersone = function() {
  if (this.tipo === 'EVENTO') {
    return this.numeroPartecipanti;
  }
  return (this.numeroPersone || (this.numeroAdulti || 0) + (this.numeroRagazzi || 0) + (this.numeroBambini || 0) + (this.numeroNeonati || 0));
};

Booking.prototype.isModificabile = function() {
  return this.stato === 'IN_ATTESA';
};

Booking.prototype.getDettagliPrenotazione = function() {
  const base = {
    id: this.id,
    tipo: this.tipo,
    cliente: this.getNomeCompletoCliente(),
    telefono: this.telefono,
    data: this.dataPrenotazione,
    orario: this.orarioArrivo,
    stato: this.stato,
    persone: this.getNumeroTotalePersone(),
    note: this.note,
    allegati: this.allegati
  };
  
  if (this.tipo === 'EVENTO') {
    return {
      ...base,
      sala: this.sala,
      evento: {
        nome: this.nomeEvento,
        partecipanti: this.numeroPartecipanti,
        bambini: this.numeroBambini,
        neonati: this.numeroNeonati,
        tipoMenu: this.tipoMenu,
        allergie: this.allergie,
        pacchetto: this.pacchetto
      }
    };
  }
  
  return {
    ...base,
    sala: this.sala,
    normale: {
      adulti: this.numeroAdulti,
      bambini: this.numeroBambini,
      neonati: this.numeroNeonati,
      tipoMenu: this.tipoMenu,
      totale: this.numeroPersone
    }
  };
};

module.exports = Booking; 