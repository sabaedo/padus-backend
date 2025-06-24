const { sequelize } = require('../config/database');
const { User, Booking, Notification } = require('../models');

async function initDatabase() {
  try {
    console.log('🔄 RAILWAY - Inizializzazione database production...');
    
    // Sincronizza SENZA force per preservare dati esistenti
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ RAILWAY - Tabelle database create/aggiornate');
    
    // Verifica che le tabelle siano state create
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 RAILWAY - Tabelle presenti:', tables);
    
    // Test connessione database
    await sequelize.authenticate();
    console.log('✅ RAILWAY - Connessione database confermata');
    
    // Conta record esistenti
    const userCount = await User.count();
    const bookingCount = await Booking.count();
    const notificationCount = await Notification.count();
    
    console.log('📊 RAILWAY - Record esistenti:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Bookings: ${bookingCount}`);
    console.log(`   Notifications: ${notificationCount}`);
    
    // Se non ci sono utenti, crea l'admin di default
    if (userCount === 0) {
      console.log('🔧 RAILWAY - Creazione utente admin di default...');
      
      const adminUser = await User.create({
        nome: 'Admin',
        cognome: 'Sistema',
        email: 'admin@padus.com',
        password: 'Admin123!',
        ruolo: 'ADMIN',
        livelloPermessi: 'AMMINISTRATORE',
        attivo: true
      });
      
      console.log('✅ RAILWAY - Utente admin creato:', adminUser.email);
    }
    
    console.log('\n🎉 RAILWAY - Database inizializzato con successo!');
    
    return true;
    
  } catch (error) {
    console.error('❌ RAILWAY - Errore inizializzazione database:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return false;
  } finally {
    await sequelize.close();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  initDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ RAILWAY - Errore fatale:', error);
      process.exit(1);
    });
}

module.exports = initDatabase; 