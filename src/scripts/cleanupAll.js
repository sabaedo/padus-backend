const { Booking, User, Notification, AuditLog } = require('../models');

async function cleanupAllData() {
  try {
    console.log('🧹 PULIZIA COMPLETA DATABASE - Inizio...');
    
    // 1. Elimina tutte le prenotazioni
    const deletedBookings = await Booking.destroy({ where: {} });
    console.log(`✅ Eliminate ${deletedBookings} prenotazioni`);
    
    // 2. Elimina tutte le notifiche
    const deletedNotifications = await Notification.destroy({ where: {} });
    console.log(`✅ Eliminate ${deletedNotifications} notifiche`);
    
    // 3. Elimina tutti i log di audit
    const deletedAuditLogs = await AuditLog.destroy({ where: {} });
    console.log(`✅ Eliminati ${deletedAuditLogs} log di audit`);
    
    // 4. NON eliminare gli utenti per sicurezza
    console.log('ℹ️ Utenti mantenuti per sicurezza');
    
    console.log('✅ PULIZIA COMPLETA DATABASE - Completata!');
    
    return {
      success: true,
      deletedBookings,
      deletedNotifications,
      deletedAuditLogs
    };
    
  } catch (error) {
    console.error('❌ Errore durante pulizia completa:', error);
    throw error;
  }
}

// Se eseguito direttamente
if (require.main === module) {
  cleanupAllData()
    .then(result => {
      console.log('🧹 RISULTATO PULIZIA:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ ERRORE PULIZIA:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAllData }; 