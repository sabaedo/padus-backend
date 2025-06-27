const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * 🔑 SCRIPT CREAZIONE ACCOUNT CONDIVISI
 * Crea gli account staff@padus.com e admin@padus.com per cross-device
 */

const createSharedAccounts = async () => {
  try {
    console.log('🚀 CREAZIONE ACCOUNT CONDIVISI - Avvio...');
    
    // Connetti al database
    await sequelize.authenticate();
    console.log('✅ Database connesso');
    
    // Sincronizza modelli (crea tabelle se non esistono)
    await sequelize.sync();
    console.log('✅ Modelli sincronizzati');
    
    // Account condivisi da creare
    const sharedAccounts = [
      {
        nome: 'Staff',
        cognome: 'Padus',
        email: 'staff@padus.com',
        password: 'staff123',
        ruolo: 'STAFF',
        permessi: 'BASE',
        attivo: true
      },
      {
        nome: 'Admin',
        cognome: 'Padus',
        email: 'admin@padus.com',
        password: 'admin123',
        ruolo: 'ADMIN',
        permessi: 'AMMINISTRATORE',
        attivo: true
      }
    ];
    
    console.log('📝 ACCOUNT DA CREARE:', sharedAccounts.length);
    
    for (const accountData of sharedAccounts) {
      try {
        // Controlla se l'account esiste già
        const existingUser = await User.findOne({ 
          where: { email: accountData.email } 
        });
        
        if (existingUser) {
          console.log(`⚠️ Account ${accountData.email} già esistente - aggiorno password`);
          
          // Aggiorna password e assicurati che sia attivo
          await existingUser.update({
            password: accountData.password,
            attivo: true,
            nome: accountData.nome,
            cognome: accountData.cognome,
            ruolo: accountData.ruolo,
            permessi: accountData.permessi
          });
          
          console.log(`✅ Account ${accountData.email} aggiornato`);
        } else {
          // Crea nuovo account
          const newUser = await User.create(accountData);
          console.log(`✅ Account ${accountData.email} creato con ID: ${newUser.id}`);
        }
        
        // Verifica che la password funzioni
        const user = await User.findOne({ where: { email: accountData.email } });
        const passwordCheck = await user.checkPassword(accountData.password);
        
        if (passwordCheck) {
          console.log(`🔑 Password verificata per ${accountData.email}`);
        } else {
          console.error(`❌ Password NON funziona per ${accountData.email}`);
        }
        
      } catch (accountError) {
        console.error(`❌ Errore creazione account ${accountData.email}:`, accountError.message);
      }
    }
    
    // Verifica finale
    console.log('\n📊 VERIFICA FINALE:');
    const allUsers = await User.findAll({
      where: {
        email: ['staff@padus.com', 'admin@padus.com']
      },
      attributes: ['id', 'email', 'ruolo', 'permessi', 'attivo']
    });
    
    console.table(allUsers.map(user => ({
      ID: user.id,
      Email: user.email,
      Ruolo: user.ruolo,
      Permessi: user.permessi,
      Attivo: user.attivo
    })));
    
    console.log('\n✅ ACCOUNT CONDIVISI CREATI CON SUCCESSO!');
    console.log('\n🔑 CREDENZIALI:');
    console.log('Staff: staff@padus.com / staff123');
    console.log('Admin: admin@padus.com / admin123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERRORE CREAZIONE ACCOUNT:', error);
    process.exit(1);
  }
};

// Esegui solo se chiamato direttamente
if (require.main === module) {
  createSharedAccounts();
}

module.exports = { createSharedAccounts }; 