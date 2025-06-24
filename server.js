const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import database e modelli
const { sequelize } = require('./src/config/database');
require('./src/models'); // Carica i modelli e le associazioni

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Import services
const notificationService = require('./src/services/notificationService');
const cronService = require('./src/services/cronService');
const initDatabase = require('./src/scripts/initDatabase');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
const server = createServer(app);

// Configurazione Socket.IO per notifiche real-time
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware globali
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined'));

// 🔍 DEBUG: Middleware per loggare richieste preflight CORS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('🌐 CORS PREFLIGHT - Richiesta OPTIONS ricevuta:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      accessControlRequestMethod: req.headers['access-control-request-method'],
      accessControlRequestHeaders: req.headers['access-control-request-headers']
    });
  } else {
    console.log('📡 RICHIESTA HTTP:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      authorization: req.headers.authorization ? 'PRESENTE' : 'ASSENTE'
    });
  }
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servizio file statici (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - ESCLUSI endpoints critici per sync
app.use('/api/', (req, res, next) => {
  // Skip rate limiting per sync endpoints critici
  if (req.path.startsWith('/bookings/sync') || req.path === '/bookings') {
    console.log('🔓 RATE LIMITING BYPASSATO per:', req.path);
    return next();
  }
  // Applica rate limiting per tutto il resto
  return apiLimiter(req, res, next);
});

// Socket.IO middleware per autenticazione
const socketAuth = require('./src/middleware/socketAuth');
io.use(socketAuth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// PWA Service Worker e Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'PADUS Prenotazioni',
    short_name: 'PADUS',
    description: 'Sistema gestione prenotazioni PADUS',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366F1',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  });
});

// Gestione Socket.IO per notifiche real-time
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user to personal room
  socket.join(`user_${socket.userId}`);
  
  // Join admins to admin room
  if (socket.userRole === 'ADMIN' || socket.userRole === 'ADMIN_SECONDARIO') {
    socket.join('admins');
  }
  
  // 🚀 EVENTI REAL-TIME BOOKING
  socket.on('booking-created', (data) => {
    console.log('📨 Booking creata via Socket.IO:', data);
    // Broadcast a tutti gli utenti connessi
    socket.broadcast.emit('booking-created', data);
    // Broadcast specifico agli admin
    io.to('admins').emit('booking-created', data);
  });

  socket.on('booking-updated', (data) => {
    console.log('📝 Booking aggiornata via Socket.IO:', data);
    socket.broadcast.emit('booking-updated', data);
    io.to('admins').emit('booking-updated', data);
  });

  socket.on('booking-deleted', (data) => {
    console.log('🗑️ Booking eliminata via Socket.IO:', data);
    socket.broadcast.emit('booking-deleted', data);
    io.to('admins').emit('booking-deleted', data);
  });

  // 📊 EVENTI STATISTICHE
  socket.on('stats-request', () => {
    console.log('📊 Richiesta statistiche via Socket.IO');
    // Qui potresti calcolare e inviare statistiche aggiornate
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Rendi io disponibile globalmente
app.set('io', io);

// Inizializza servizio notifiche
notificationService.init(io);

// Inizializza servizio cron jobs (solo in produzione)
if (process.env.NODE_ENV === 'production') {
  cronService.init();
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint non trovato' 
  });
});

const PORT = process.env.PORT || 3001;

// Connessione database e avvio server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connesso con successo');
    
    // 🔧 AUTO-INIZIALIZZAZIONE DATABASE per Railway
    console.log('🔄 AVVIO AUTO-INIZIALIZZAZIONE DATABASE...');
    
    try {
      // Sincronizza SEMPRE le tabelle (production-safe)
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ RAILWAY - Tabelle database create/aggiornate');
      
      // Verifica che le tabelle siano state create
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('📋 RAILWAY - Tabelle presenti:', tables);
      
      // Conta record esistenti per verifica
      const { User, Booking, Notification } = require('./src/models');
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
      
      console.log('🎉 RAILWAY - Auto-inizializzazione database completata!');
      
    } catch (initError) {
      console.error('⚠️ RAILWAY - Errore auto-inizializzazione (continuo comunque):', {
        message: initError.message,
        stack: initError.stack
      });
      // Non blocca l'avvio del server
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server avviato sulla porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🔗 URL: https://padus-backend-production.up.railway.app`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io }; 