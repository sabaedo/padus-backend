const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env' });

let sequelize;

if (process.env.DATABASE_URL) {
  // Configurazione per produzione (es. Railway, Heroku)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Disabilita il logging SQL in produzione
    define: {
      timestamps: true,
      underscored: false
    }
  });
} else {
  // Configurazione per sviluppo locale
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
      define: {
        timestamps: true,
        underscored: false
      }
    }
  );
}

// Test connessione
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connesso con successo');
  } catch (error) {
    console.error('❌ Errore connessione database:', error.message);
  }
};

module.exports = { sequelize, testConnection }; 