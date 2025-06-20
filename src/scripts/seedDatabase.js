const { sequelize } = require('../config/database');
const { User, Booking, Notification } = require('../models');

async function seedDatabase() {
  try {
    console.log('🔄 Inizializzazione database...');
    
    // Forza la ricreazione delle tabelle (solo per development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: true });
      console.log('✅ Tabelle database ricreate');
    }
    
    // Crea utente admin di default
    const adminUser = await User.create({
      nome: 'Admin',
      cognome: 'Sistema',
      email: 'admin@padus.com',
      password: 'Admin123!',
      ruolo: 'ADMIN',
      permessi: 'AMMINISTRATORE'
    });
    
    console.log('✅ Utente admin creato:', adminUser.email);
    
    // Crea utente staff di test
    const staffUser = await User.create({
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'staff@padus.com',
      password: 'Staff123!',
      ruolo: 'STAFF',
      permessi: 'AUTORIZZATO'
    });
    
    console.log('✅ Utente staff creato:', staffUser.email);
    
    // Crea alcune prenotazioni di esempio
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookingNormale = await Booking.create({
      tipo: 'NORMALE',
      nomeCliente: 'Giuseppe',
      cognomeCliente: 'Verdi',
      telefono: '333-1234567',
      dataPrenotazione: tomorrow.toISOString().split('T')[0],
      orarioArrivo: '19:30',
      numeroAdulti: 2,
      numeroBambini: 1,
      numeroPersone: 3,
      note: 'Tavolo vicino alla finestra',
      stato: 'IN_ATTESA',
      creatoId: staffUser.id
    });
    
    console.log('✅ Prenotazione normale creata');
    
    const bookingEvento = await Booking.create({
      tipo: 'EVENTO',
      nomeCliente: 'Laura',
      cognomeCliente: 'Bianchi',
      telefono: '345-9876543',
      dataPrenotazione: tomorrow.toISOString().split('T')[0],
      orarioArrivo: '20:00',
      nomeEvento: 'Compleanno 30 anni',
      numeroPartecipanti: 15,
      tipoMenu: 'Menu degustazione',
      allergie: 'Nessuna allergia particolare',
      pacchetto: 'Menu completo + bevande',
      note: 'Torta personalizzata richiesta',
      stato: 'CONFERMATA',
      creatoId: staffUser.id,
      processatoDa: adminUser.id,
      dataProcessamento: new Date()
    });
    
    console.log('✅ Prenotazione evento creata');
    
    // Crea notifica di esempio
    await Notification.create({
      titolo: 'Nuova prenotazione in attesa',
      messaggio: `Nuova prenotazione da ${bookingNormale.getNomeCompletoCliente()} per ${bookingNormale.getNumeroTotalePersone()} persone`,
      tipo: 'NUOVA_PRENOTAZIONE',
      priorita: 'MEDIA',
      userId: adminUser.id,
      bookingId: bookingNormale.id
    });
    
    console.log('✅ Notifica di esempio creata');
    
    console.log('\n🎉 Database inizializzato con successo!');
    console.log('\n📋 Credenziali di accesso:');
    console.log('Admin: admin@padus.com / Admin123!');
    console.log('Staff: staff@padus.com / Staff123!');
    console.log('\n🔑 Password ruoli per registrazione:');
    console.log('STAFF: STAFF');
    console.log('ADMIN: ADMIN');
    
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
  } finally {
    await sequelize.close();
  }
}

// Esegui seed se chiamato direttamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 