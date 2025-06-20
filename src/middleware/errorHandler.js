const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Errore:', err);

  // Errori di validazione Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: `Errore di validazione: ${message}`
    };
  }

  // Errori di vincoli unici Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Email già registrata nel sistema';
    error = {
      statusCode: 400,
      message
    };
  }

  // Errori di foreign key Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      statusCode: 400,
      message: 'Riferimento non valido'
    };
  }

  // Errori di cast (ID non validi)
  if (err.name === 'CastError') {
    const message = 'Risorsa non trovata';
    error = {
      statusCode: 404,
      message
    };
  }

  // Errori di duplicazione
  if (err.code === 11000) {
    const message = 'Risorsa duplicata';
    error = {
      statusCode: 400,
      message
    };
  }

  // Errori di validazione
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message
    };
  }

  // Errori JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Token non valido'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token scaduto'
    };
  }

  // Errori di file upload
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File troppo grande. Dimensione massima: 5MB'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      statusCode: 400,
      message: 'Troppi file. Massimo 5 file per volta'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      statusCode: 400,
      message: 'Campo file non previsto'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

module.exports = errorHandler; 