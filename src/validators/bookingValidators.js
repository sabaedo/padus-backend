const { body, query } = require('express-validator');

const createBookingValidator = [
  body('tipo')
    .isIn(['NORMALE', 'EVENTO'])
    .withMessage('Tipo deve essere NORMALE o EVENTO'),
    
  body('nomeCliente')
    .notEmpty()
    .withMessage('Nome cliente è richiesto')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome cliente deve essere tra 2 e 100 caratteri'),
    
  body('cognomeCliente')
    .notEmpty()
    .withMessage('Cognome cliente è richiesto')
    .isLength({ min: 2, max: 100 })
    .withMessage('Cognome cliente deve essere tra 2 e 100 caratteri'),
    
  body('telefono')
    .notEmpty()
    .withMessage('Telefono è richiesto')
    .matches(/^[+]?[\d\s\-\(\)]{8,20}$/)
    .withMessage('Formato telefono non valido'),
    
  body('dataPrenotazione')
    .isDate()
    .withMessage('Data prenotazione non valida')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(value);
      
      if (inputDate < today) {
        throw new Error('Non puoi prenotare per una data passata');
      }
      return value;
    }),
    
  body('orarioArrivo')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato orario non valido (HH:MM)'),
    
  // Validazioni per prenotazione normale
  body('numeroAdulti')
    .if(body('tipo').equals('NORMALE'))
    .isInt({ min: 0, max: 200 })
    .withMessage('Numero adulti deve essere tra 0 e 200'),
    
  body('numeroRagazzi')
    .if(body('tipo').equals('NORMALE'))
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero ragazzi deve essere tra 0 e 100'),
    
  body('numeroNeonati')
    .if(body('tipo').equals('NORMALE'))
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero neonati deve essere tra 0 e 100'),
    
  body('numeroBambini')
    .if(body('tipo').equals('NORMALE'))
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero bambini deve essere tra 0 e 100'),
    
  // Validazioni per evento
  body('nomeEvento')
    .if(body('tipo').equals('EVENTO'))
    .notEmpty()
    .withMessage('Nome evento è richiesto per gli eventi')
    .isLength({ min: 3, max: 200 })
    .withMessage('Nome evento deve essere tra 3 e 200 caratteri'),
    
  body('numeroPartecipanti')
    .if(body('tipo').equals('EVENTO'))
    .isInt({ min: 1, max: 500 })
    .withMessage('Numero partecipanti deve essere tra 1 e 500'),
    
  body('tipoMenu')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tipo menu deve essere tra 3 e 100 caratteri per evento'),
    
  body('numeroBambini')
    .if(body('tipo').equals('EVENTO'))
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero bambini deve essere tra 0 e 100 per evento'),

  body('numeroNeonati')
    .if(body('tipo').equals('EVENTO'))
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero neonati deve essere tra 0 e 100 per evento'),

  body('sala')
    .optional()
    .isIn(['SALA_BAR','SALA_BAR_RISERVATA','SALA_VETRI','SALA_VETRI_RISERVATA','ESTERNO','PISCINA','TOOCOOL'])
    .withMessage('Sala non valida'),
    
  body('note')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Note troppo lunghe (massimo 1000 caratteri)')
];

const updateBookingValidator = [
  body('nomeCliente')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome cliente deve essere tra 2 e 100 caratteri'),
    
  body('cognomeCliente')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cognome cliente deve essere tra 2 e 100 caratteri'),
    
  body('telefono')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]{8,20}$/)
    .withMessage('Formato telefono non valido'),
    
  body('dataPrenotazione')
    .optional()
    .isDate()
    .withMessage('Data prenotazione non valida')
    .custom((value) => {
      if (value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(value);
        
        if (inputDate < today) {
          throw new Error('Non puoi prenotare per una data passata');
        }
      }
      return value;
    }),
    
  body('orarioArrivo')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato orario non valido (HH:MM)'),
    
  body('numeroRagazzi')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero ragazzi deve essere tra 0 e 100'),

  body('numeroNeonati')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Numero neonati deve essere tra 0 e 100'),

  body('sala')
    .optional()
    .isIn(['SALA_BAR','SALA_BAR_RISERVATA','SALA_VETRI','SALA_VETRI_RISERVATA','ESTERNO','PISCINA','TOOCOOL'])
    .withMessage('Sala non valida'),
    
  body('note')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Note troppo lunghe (massimo 1000 caratteri)')
];

const updateStatusValidator = [
  body('stato')
    .isIn(['CONFERMATA', 'RIFIUTATA'])
    .withMessage('Stato deve essere CONFERMATA o RIFIUTATA'),
    
  body('motivoRifiuto')
    .if(body('stato').equals('RIFIUTATA'))
    .notEmpty()
    .withMessage('Motivo rifiuto è richiesto quando si rifiuta una prenotazione')
    .isLength({ min: 5, max: 500 })
    .withMessage('Motivo rifiuto deve essere tra 5 e 500 caratteri')
];

const calendarQueryValidator = [
  query('startDate')
    .isDate()
    .withMessage('Data inizio non valida'),
    
  query('endDate')
    .isDate()
    .withMessage('Data fine non valida')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('Data fine deve essere successiva alla data inizio');
        }
      }
      return value;
    })
];

module.exports = {
  createBookingValidator,
  updateBookingValidator,
  updateStatusValidator,
  calendarQueryValidator
}; 