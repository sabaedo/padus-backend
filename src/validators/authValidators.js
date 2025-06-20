const { body } = require('express-validator');

const registerValidator = [
  body('nome')
    .notEmpty()
    .withMessage('Nome è richiesto')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve essere tra 2 e 50 caratteri'),
    
  body('cognome')
    .notEmpty()
    .withMessage('Cognome è richiesto')
    .isLength({ min: 2, max: 50 })
    .withMessage('Cognome deve essere tra 2 e 50 caratteri'),
    
  body('email')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password deve essere tra 6 e 100 caratteri'),
    
  body('ruolo')
    .isIn(['STAFF', 'ADMIN'])
    .withMessage('Ruolo deve essere STAFF o ADMIN'),
    
  body('passwordRuolo')
    .notEmpty()
    .withMessage('Password ruolo è richiesta')
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password è richiesta')
];

module.exports = {
  registerValidator,
  loginValidator
}; 