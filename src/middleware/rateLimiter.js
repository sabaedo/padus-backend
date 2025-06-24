const rateLimit = require('express-rate-limit');

// Rate limiter generale per API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // massimo 100 richieste per IP ogni 15 minuti
  message: {
    success: false,
    message: 'Troppe richieste da questo IP, riprova più tardi'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter specifico per login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // massimo 5 tentativi di login per IP ogni 15 minuti
  message: {
    success: false,
    message: 'Troppi tentativi di login, riprova tra 15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // non conta le richieste riuscite
});

// Rate limiter per registrazione
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // massimo 3 registrazioni per IP ogni ora
  message: {
    success: false,
    message: 'Troppe registrazioni da questo IP, riprova tra 1 ora'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter per upload file
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 20, // massimo 20 upload per IP ogni 10 minuti
  message: {
    success: false,
    message: 'Troppi upload da questo IP, riprova più tardi'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  uploadLimiter
}; 