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
    allowNull: true
  },
  numeroPartecipanti: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipoMenu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  allergie: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pacchetto: {
    type: DataTypes.STRING,
    allowNull: true
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
    defaultValue: 'CONFERMATA'
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
  // Restituire TUTTI i campi raw del database per evitare dati corrotti
  const base = {
    id: this.id,
    tipo: this.tipo,
    // Campi originali del database
    nomeCliente: this.nomeCliente,
    cognomeCliente: this.cognomeCliente,
    dataPrenotazione: this.dataPrenotazione,
    numeroAdulti: this.numeroAdulti,
    numeroRagazzi: this.numeroRagazzi,
    numeroBambini: this.numeroBambini,
    numeroNeonati: this.numeroNeonati,
    numeroPersone: this.numeroPersone,
    // Alias per compatibilità
    cliente: this.getNomeCompletoCliente(),
    telefono: this.telefono,
    data: this.dataPrenotazione,
    orario: this.orarioArrivo,
    stato: this.stato,
    persone: this.getNumeroTotalePersone(),
    note: this.note,
    allegati: this.allegati,
    sala: this.sala,
    creatoIl: this.creatoIl,
    modificatoIl: this.modificatoIl
  };
  
  if (this.tipo === 'EVENTO') {
    return {
      ...base,
      nomeEvento: this.nomeEvento,
      numeroPartecipanti: this.numeroPartecipanti,
      tipoMenu: this.tipoMenu,
      allergie: this.allergie,
      pacchetto: this.pacchetto,
      // Compatibilità con vecchia struttura
      evento: {
        nome: this.nomeEvento,
        partecipanti: this.numeroPartecipanti,
        bambini: this.numeroBambini,
        neonati: this.numeroNeonati,
        ragazzi: this.numeroRagazzi,
        tipoMenu: this.tipoMenu,
        allergie: this.allergie,
        pacchetto: this.pacchetto
      }
    };
  }
  
  return {
    ...base,
    tipoMenu: this.tipoMenu,
    // Compatibilità con vecchia struttura
    normale: {
      adulti: this.numeroAdulti,
      ragazzi: this.numeroRagazzi,
      bambini: this.numeroBambini,
      neonati: this.numeroNeonati,
      tipoMenu: this.tipoMenu,
      totale: this.numeroPersone
    }
  };
};

module.exports = Booking; 