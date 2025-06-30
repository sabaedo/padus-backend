const { sequelize } = require('../config/database');
const { User, Booking, Notification } = require('../models');

async function forceSchemaSync() {
  try {
    console.log('🚨 EMERGENCY UUID CONVERSION - Risoluzione errori PostgreSQL...');
    
    // 1. Backup con query SQL diretta (evita errori di tipo)
    console.log('📊 Step 1: Backup dati con query diretta...');
    let existingBookings = [];
    
    try {
      const [results] = await sequelize.query(
        'SELECT * FROM "bookings"', 
        { type: sequelize.QueryTypes.SELECT }
      );
      existingBookings = results || [];
      console.log(`   📋 Bookings trovati: ${existingBookings.length}`);
    } catch (backupError) {
      console.log('⚠️ Nessun dato da backup:', backupError.message);
    }
    
    // 2. DROP COMPLETO per schema pulito
    console.log('🔄 Step 2: Pulizia completa database...');
    await sequelize.query('DROP TABLE IF EXISTS "bookings" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "users" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "notifications" CASCADE;');
    console.log('✅ Tabelle eliminate');
    
    // 3. Ricrea con UUID puliti
    console.log('🔄 Step 3: Ricreazione schema UUID...');
    await sequelize.sync({ force: true });
    console.log('✅ Schema UUID ricreato');
    
    // 4. Account essenziali
    console.log('🔑 Step 4: Account di sistema...');
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
    
    console.log('✅ Account UUID creati');
    
    // 5. Migrazione bookings (ID numerici → UUID)
    if (existingBookings.length > 0) {
      console.log('📥 Step 5: Conversione ID numerici → UUID...');
      
      let converted = 0;
      for (const old of existingBookings) {
        try {
          await Booking.create({
            tipo: old.tipo || 'NORMALE',
            nomeCliente: old.nomeCliente || 'Cliente',
            cognomeCliente: old.cognomeCliente || 'Migrato', 
            telefono: old.telefono || '1234567890',
            dataPrenotazione: old.dataPrenotazione || new Date(),
            orarioArrivo: old.orarioArrivo || '19:00',
            numeroAdulti: old.numeroAdulti || 2,
            numeroRagazzi: old.numeroRagazzi || 0,
            numeroBambini: old.numeroBambini || 0, 
            numeroNeonati: old.numeroNeonati || 0,
            stato: 'CONFERMATA',
            creatoId: staffUser.id
          });
          converted++;
        } catch (err) {
          console.warn(`Skip: ${err.message}`);
        }
      }
      console.log(`✅ Convertiti: ${converted}`);
    }
    
    // 6. Verifica UUID
    console.log('🔍 Step 6: Verifica UUID...');
    const sample = await Booking.findOne();
    console.log('📋 Sample UUID:', sample?.id);
    console.log('✅ Formato UUID valido:', sample?.id?.includes('-'));
    
    console.log('🎉 CONVERSIONE UUID COMPLETATA!');
    return true;
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    return false;
  }
}

module.exports = forceSchemaSync;

if (require.main === module) {
  forceSchemaSync()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
} 