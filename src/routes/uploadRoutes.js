const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError 
} = require('../middleware/upload');

// Import controllers
const {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile,
  getFileDetails,
  getUserFiles
} = require('../controllers/uploadController');

// Applica autenticazione a tutte le route
router.use(authenticate);

// Upload singolo file
router.post('/single', uploadSingle, handleUploadError, uploadSingleFile);

// Upload multipli file
router.post('/multiple', uploadMultiple, handleUploadError, uploadMultipleFiles);

// Lista file utente
router.get('/my-files', getUserFiles);

// Dettagli file specifico
router.get('/:filename/info', getFileDetails);

// Elimina file
router.delete('/:filename', deleteUploadedFile);

module.exports = router; 