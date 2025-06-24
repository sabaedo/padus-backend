const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env' });

let sequelize;

// Usa sempre PostgreSQL
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