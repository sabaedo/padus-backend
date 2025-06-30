const { sequelize } = require('../config/database');
const { User, Booking, Notification } = require('../models');

async function forceSchemaSync() {
  try {
    console.log('🚨 EMERGENCY SCHEMA SYNC - Risoluzione errori PostgreSQL...');
    
    // 1. Backup dei dati esistenti
    console.log('📊 Step 1: Backup dati esistenti...');
    const existingBookings = await Booking.findAll({}).catch(() => []);
    console.log(`   Bookings da preservare: ${existingBookings.length}`);
    
    // 2. Drop e ricrea tabelle con schema corretto
    console.log('🔄 Step 2: Ricreazione schema con force...');
    await sequelize.sync({ force: true });
    console.log('✅ Schema database ricreato');
    
    // 3. Ricrea account essenziali
    console.log('🔑 Step 3: Ricreazione account essenziali...');
    
    const adminUser = await User.create({
      nome: 'Admin',
      cognome: 'Padus',
      email: 'admin@padus.com',
      password: 'admin123',
      ruolo: 'ADMIN',
      livelloPermessi: 'AMMINISTRATORE',
      attivo: true
    });
    
    const staffUser = await User.create({
      nome: 'Staff',
      cognome: 'Padus',
      email: 'staff@padus.com',
      password: 'staff123',
      ruolo: 'STAFF',
      livelloPermessi: 'BASE',
      attivo: true
    });
    
    console.log('✅ Account creati:', {
      admin: adminUser.id,
      staff: staffUser.id
    });
    
    // 4. Ripristina i booking se esistevano (con creatoId valido)
    if (existingBookings.length > 0) {
      console.log('📥 Step 4: Ripristino bookings...');
      
      let restored = 0;
      for (const booking of existingBookings) {
        try {
          await Booking.create({
            ...booking.dataValues,
            creatoId: staffUser.id, // Usa staff come creatore di default
            id: undefined // Lascia che generi nuovo UUID
          });
          restored++;
        } catch (restoreError) {
          console.warn('⚠️ Booking non ripristinabile:', restoreError.message);
        }
      }
      
      console.log(`✅ Ripristinati ${restored}/${existingBookings.length} booking`);
    }
    
    // 5. Verifica finale
    console.log('🔍 Step 5: Verifica finale...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    const userCount = await User.count();
    const bookingCount = await Booking.count();
    
    console.log('📋 Risultato finale:', {
      tabelle: tables,
      users: userCount,
      bookings: bookingCount
    });
    
    console.log('🎉 EMERGENCY SCHEMA SYNC COMPLETATO!');
    return true;
    
  } catch (error) {
    console.error('❌ ERRORE EMERGENCY SYNC:', error);
    return false;
  }
}

module.exports = forceSchemaSync;

// Esegui se chiamato direttamente
if (require.main === module) {
  forceSchemaSync()
    .then(success => {
      console.log(success ? '✅ SYNC RIUSCITO' : '❌ SYNC FALLITO');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ ERRORE FATALE:', error);
      process.exit(1);
    });
} 