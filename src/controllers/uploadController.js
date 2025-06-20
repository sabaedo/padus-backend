const { getFileInfo, deleteFile } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// @desc    Upload singolo file
// @route   POST /api/upload/single
// @access  Private
const uploadSingleFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file selezionato'
      });
    }

    const fileInfo = getFileInfo(req.file);

    res.json({
      success: true,
      message: 'File caricato con successo',
      data: fileInfo
    });

  } catch (error) {
    console.error('Errore upload singolo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Upload multipli file
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleFiles = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file selezionato'
      });
    }

    const filesInfo = req.files.map(file => getFileInfo(file));

    res.json({
      success: true,
      message: `${req.files.length} file caricati con successo`,
      data: filesInfo
    });

  } catch (error) {
    console.error('Errore upload multipli:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Elimina file
// @route   DELETE /api/upload/:filename
// @access  Private
const deleteUploadedFile = (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Sicurezza: impedisce traversal path
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nome file non valido'
      });
    }

    // Cerca il file nelle subdirectory
    const possiblePaths = [
      path.join('./uploads', 'bookings', filename),
      path.join('./uploads', 'general', filename),
      path.join('./uploads', filename)
    ];

    let fileFound = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        deleteFile(filePath);
        fileFound = true;
        break;
      }
    }

    if (!fileFound) {
      return res.status(404).json({
        success: false,
        message: 'File non trovato'
      });
    }

    res.json({
      success: true,
      message: 'File eliminato con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione file:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Ottieni informazioni file
// @route   GET /api/upload/:filename/info
// @access  Private
const getFileDetails = (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Sicurezza: impedisce traversal path
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nome file non valido'
      });
    }

    // Cerca il file nelle subdirectory
    const possiblePaths = [
      path.join('./uploads', 'bookings', filename),
      path.join('./uploads', 'general', filename),
      path.join('./uploads', filename)
    ];

    let fileInfo = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        
        fileInfo = {
          filename,
          size: stats.size,
          uploadDate: stats.birthtime,
          modifiedDate: stats.mtime,
          type: ext === '.pdf' ? 'PDF' : 'Immagine',
          url: `/uploads/${path.relative('./uploads', filePath).replace(/\\/g, '/')}`
        };
        break;
      }
    }

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File non trovato'
      });
    }

    res.json({
      success: true,
      data: fileInfo
    });

  } catch (error) {
    console.error('Errore info file:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// @desc    Lista file utente
// @route   GET /api/upload/my-files
// @access  Private
const getUserFiles = (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // In un'implementazione reale, dovresti tracciare i file per utente nel database
    // Per ora, restituiamo tutti i file nelle directory uploads
    const directories = ['./uploads/bookings', './uploads/general'];
    const allFiles = [];

    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(filename => {
          const filePath = path.join(dir, filename);
          const stats = fs.statSync(filePath);
          const ext = path.extname(filename).toLowerCase();
          
          allFiles.push({
            filename,
            size: stats.size,
            uploadDate: stats.birthtime,
            type: ext === '.pdf' ? 'PDF' : 'Immagine',
            url: `/uploads/${path.relative('./uploads', filePath).replace(/\\/g, '/')}`
          });
        });
      }
    });

    // Ordina per data di upload più recente
    allFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    // Paginazione
    const paginatedFiles = allFiles.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(allFiles.length / limit),
          count: allFiles.length
        }
      }
    });

  } catch (error) {
    console.error('Errore lista file utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile,
  getFileDetails,
  getUserFiles
}; 