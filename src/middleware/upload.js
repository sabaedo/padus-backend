const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crea directory uploads se non esiste
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crea subdirectory per organizzare i file
    const subDir = req.path.includes('bookings') ? 'bookings' : 'general';
    const fullPath = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Genera nome file unico
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.toLowerCase();
    const sanitized = originalName.replace(/[^a-z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

// Filtro per tipi di file permessi
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo file non supportato. Formati permessi: PDF, JPG, PNG, WEBP`), false);
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // massimo 5 file per volta
  }
});

// Middleware per upload singolo
const uploadSingle = upload.single('file');

// Middleware per upload multipli
const uploadMultiple = upload.array('files', 5);

// Middleware per gestione errori upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File troppo grande. Dimensione massima: 5MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Troppi file. Massimo 5 file per volta'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo file non previsto'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Errore upload: ${err.message}`
        });
    }
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// Utility per eliminare file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File eliminato: ${filePath}`);
    }
  } catch (error) {
    console.error(`Errore eliminazione file: ${filePath}`, error);
  }
};

// Utility per ottenere informazioni file
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${path.relative('./uploads', file.path).replace(/\\/g, '/')}`
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile,
  getFileInfo
}; 