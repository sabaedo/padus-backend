const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStaffUsers,
  updateUserPermissions,
  updateUserStatus,
  getDashboardStats,
  getUserDetails
} = require('../controllers/adminController');

// Import middleware
const { 
  authenticate, 
  isAdmin, 
  isAdminOrSecondary 
} = require('../middleware/auth');

// Import funzione di pulizia
const { cleanupAllData } = require('../scripts/cleanupAll');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Dashboard statistiche (accessibile ad admin e admin secondari)
router.get('/dashboard', isAdminOrSecondary, getDashboardStats);

// Gestione utenti (solo admin)
router.get('/users', isAdmin, getStaffUsers);
router.get('/users/:id', isAdmin, getUserDetails);
router.patch('/users/:id/permissions', isAdmin, updateUserPermissions);
router.patch('/users/:id/status', isAdmin, updateUserStatus);

// 🧹 ENDPOINT PULIZIA COMPLETA - SOLO ADMIN
router.delete('/cleanup-all', isAdmin, async (req, res) => {
  try {
    console.log('🧹 ADMIN CLEANUP - Richiesta pulizia completa da:', req.user.username);

    // Esegui pulizia completa
    const result = await cleanupAllData();

    // Log di audit
    await AuditLog.create({
      action: 'CLEANUP_ALL',
      userId: req.user.id,
      details: {
        deletedBookings: result.deletedBookings,
        deletedNotifications: result.deletedNotifications,
        deletedAuditLogs: result.deletedAuditLogs,
        adminUser: req.user.username,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ ADMIN CLEANUP - Pulizia completa eseguita con successo');

    res.json({
      success: true,
      message: 'Pulizia completa eseguita con successo',
      data: result
    });

  } catch (error) {
    console.error('❌ ADMIN CLEANUP - Errore:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la pulizia completa',
      error: error.message
    });
  }
});

module.exports = router; 