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
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servizio file statici (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/', apiLimiter);

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

const PORT = process.env.PORT || 5000;

// Connessione database e avvio server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connesso con successo');
    
    // Sincronizza i modelli (solo in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelli database sincronizzati');
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server avviato sulla porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io }; 