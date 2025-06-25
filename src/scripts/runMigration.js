/**
 * 🔧 SCRIPT MIGRAZIONE DATABASE
 * Aggiunge colonna numeroRagazzi alla tabella bookings
 */

const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    console.log('🔧 MIGRAZIONE - Inizio aggiunta colonna numeroRagazzi...');
    
    // Esegui la query di migrazione
    await sequelize.query(`
      -- Aggiungere colonna numeroRagazzi se non esiste
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'bookings' AND column_name = 'numeroRagazzi'
        ) THEN
          ALTER TABLE bookings ADD COLUMN "numeroRagazzi" INTEGER;
          
          -- Aggiungere constraint di validazione
          ALTER TABLE bookings 
          ADD CONSTRAINT check_numero_ragazzi_valid 
          CHECK ("numeroRagazzi" >= 0 AND "numeroRagazzi" <= 100);
          
          -- Impostare valore default 0 per record esistenti
          UPDATE bookings 
          SET "numeroRagazzi" = 0 
          WHERE "numeroRagazzi" IS NULL;
          
          RAISE NOTICE 'Colonna numeroRagazzi aggiunta con successo';
        ELSE
          RAISE NOTICE 'Colonna numeroRagazzi già esistente';
        END IF;
      END $$;
    `);
    
    console.log('✅ MIGRAZIONE - Colonna numeroRagazzi aggiunta con successo!');
    
    // Verifica che la colonna esista
    const result = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'numeroRagazzi'
    `);
    
    if (result[0].length > 0) {
      console.log('✅ VERIFICA - Colonna numeroRagazzi confermata:', result[0][0]);
    } else {
      throw new Error('❌ Colonna numeroRagazzi non trovata dopo la migrazione');
    }
    
    return { success: true, message: 'Migrazione completata con successo' };
    
  } catch (error) {
    console.error('❌ MIGRAZIONE - Errore:', error);
    return { success: false, error: error.message };
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  runMigration()
    .then(result => {
      console.log('📋 RISULTATO MIGRAZIONE:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 ERRORE FATALE MIGRAZIONE:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 