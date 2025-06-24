# PADUS Backend - Railway Deploy

Backend del sistema PADUS per gestione prenotazioni.

## 🚀 Deploy su Railway

Questo backend è configurato per Railway con:
- Node.js + Express
- PostgreSQL database
- Socket.IO per notifiche real-time

## 📋 Configurazione Railway

Configura queste variabili d'ambiente su Railway:

```
DB_HOST=${DATABASE_HOST}
DB_PORT=${DATABASE_PORT}
DB_NAME=${DATABASE_NAME}
DB_USER=${DATABASE_USER}
DB_PASSWORD=${DATABASE_PASSWORD}
PORT=${PORT}
NODE_ENV=production
JWT_SECRET=your-secret-key-32-chars-minimum
FRONTEND_URL=https://your-netlify-app.netlify.app
STAFF_REGISTRATION_PASSWORD=STAFF2025
ADMIN_REGISTRATION_PASSWORD=ADMIN2025
```

## 🔧 Setup

1. Aggiungi PostgreSQL database su Railway
2. Configura variabili d'ambiente
3. Deploy automatico 