import api from './authService';

// Ottieni tutte le prenotazioni dell'utente
export const getUserBookings = async (page = 1, limit = 10) => {
  const response = await api.get(`/bookings?page=${page}&limit=${limit}`);
  return response.data;
};

// Ottieni singola prenotazione
export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

// Crea nuova prenotazione normale
export const createNormalBooking = async (bookingData) => {
  const response = await api.post('/bookings', {
    tipo: 'NORMALE',
    nomeCliente: bookingData.nomeCliente,
    cognomeCliente: bookingData.cognomeCliente,
    telefono: bookingData.telefono,
    numeroPersone: bookingData.numeroPersone,
    numeroBambini: bookingData.numeroBambini,
    numeroNeonati: bookingData.numeroNeonati,
    tipoMenu: bookingData.tipoMenu,
    sala: bookingData.sala,
    dataPrenotazione: bookingData.dataPrenotazione,
    orarioArrivo: bookingData.orarioArrivo,
    note: bookingData.note
  });
  return response.data;
};

// Crea prenotazione evento
export const createEventBooking = async (bookingData) => {
  const response = await api.post('/bookings', {
    tipo: 'EVENTO',
    nomeEvento: bookingData.nomeEvento,
    numeroPartecipanti: bookingData.partecipanti,
    numeroBambini: bookingData.numeroBambini,
    numeroNeonati: bookingData.numeroNeonati,
    tipoMenu: bookingData.tipoMenu,
    sala: bookingData.sala,
    allergie: bookingData.allergie,
    pacchetto: bookingData.pacchetto,
    dataPrenotazione: bookingData.dataPrenotazione,
    orarioArrivo: bookingData.orarioArrivo,
    note: bookingData.note
  });
  return response.data;
};

// Aggiorna prenotazione
export const updateBooking = async (id, bookingData) => {
  const response = await api.put(`/bookings/${id}`, bookingData);
  return response.data;
};

// Elimina prenotazione
export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

// Ottieni prenotazioni per calendario
export const getCalendarBookings = async (date) => {
  const response = await api.get(`/bookings/calendar/${date}`);
  return response.data;
};

// Upload allegato per prenotazione
export const uploadBookingFile = async (bookingId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bookingId', bookingId);
  
  const response = await api.post('/upload/booking', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Admin: Conferma prenotazione
export const confirmBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/confirm`);
  return response.data;
};

// Admin: Rifiuta prenotazione
export const rejectBooking = async (id, reason) => {
  const response = await api.post(`/bookings/${id}/reject`, { reason });
  return response.data;
}; 