console.log('🧪 INIZIO TEST SINTASSI BACKEND...\n');

const testModules = [
  'express',
  'cors', 
  'helmet',
  'morgan',
  'compression',
  'jsonwebtoken',
  'bcryptjs',
  'sequelize',
  'pg',
  'multer',
  'socket.io',
  'node-cron',
  'fast-csv',
  'pdfkit'
];

console.log('📦 Test dipendenze principali...');
let dependenciesOk = true;

testModules.forEach(module => {
  try {
    require(module);
    console.log(`✅ ${module}`);
  } catch (error) {
    console.log(`❌ ${module}: ${error.message}`);
    dependenciesOk = false;
  }
});

console.log('\n📁 Test sintassi file backend...');

const backendFiles = [
  '../config/database.js',
  '../models/User.js',
  '../models/Booking.js', 
  '../models/Notification.js',
  '../models/AuditLog.js',
  '../controllers/authController.js',
  '../controllers/bookingController.js',
  '../controllers/adminController.js',
  '../controllers/uploadController.js',
  '../controllers/statsController.js',
  '../controllers/profileController.js',
  '../controllers/notificationController.js',
  '../services/notificationService.js',
  '../services/cronService.js',
  '../services/auditService.js',
  '../middleware/auth.js',
  '../middleware/upload.js',
  '../middleware/rateLimiter.js',
  '../middleware/errorHandler.js'
];

let syntaxOk = true;

backendFiles.forEach(file => {
  try {
    require(file);
    console.log(`✅ ${file.split('/').pop()}`);
  } catch (error) {
    console.log(`❌ ${file.split('/').pop()}: ${error.message}`);
    syntaxOk = false;
  }
});

console.log('\n📋 RISULTATI:');
console.log(`Dependencies: ${dependenciesOk ? '✅ OK' : '❌ ERRORI'}`);
console.log(`Syntax: ${syntaxOk ? '✅ OK' : '❌ ERRORI'}`);

if (dependenciesOk && syntaxOk) {
  console.log('\n🎉 BACKEND SINTASSI OK - PRONTO PER AVVIO!');
} else {
  console.log('\n⚠️ ERRORI RILEVATI - CORREGGERE PRIMA DELL\'AVVIO');
}

process.exit(dependenciesOk && syntaxOk ? 0 : 1); 