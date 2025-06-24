import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Download,
  Check,
  AlertTriangle,
  Edit3,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const BookingDetailModal = ({ booking, isOpen, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(booking?.notes || '');
  const [status, setStatus] = useState(booking?.status || 'PENDING');
  const { user, canManageBookings } = useAuth();

  if (!booking || !isOpen) return null;

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await onUpdate(booking.id, { status: newStatus });
      setStatus(newStatus);
      
      const statusMessages = {
        CONFIRMED: 'Prenotazione confermata con successo',
        CANCELLED: 'Prenotazione cancellata',
        COMPLETED: 'Prenotazione completata'
      };
      
      notificationService.showSuccess(statusMessages[newStatus]);
    } catch (error) {
      notificationService.showError('Errore aggiornamento stato');
    }
    setLoading(false);
  };

  const handleNotesUpdate = async () => {
    setLoading(true);
    try {
      await onUpdate(booking.id, { notes });
      notificationService.showSuccess('Note aggiornate');
    } catch (error) {
      notificationService.showError('Errore aggiornamento note');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      try {
        await onDelete(booking.id);
        notificationService.showSuccess('Prenotazione eliminata');
        onClose();
      } catch (error) {
        notificationService.showError('Errore eliminazione prenotazione');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'CANCELLED': return 'text-red-700 bg-red-100';
      case 'COMPLETED': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED': return <Check className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      case 'COMPLETED': return <Check className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSalaBadge = (sala) => {
    const baseClasses = 'font-bold px-2 py-1 rounded-md text-sm';
    switch (sala) {
      case 'SALA_BAR':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Sala Bar</span>;
      case 'SALA_BAR_RISERVATA':
        return <span className={`${baseClasses} bg-yellow-200 text-yellow-900`}>Sala Bar (Riservata)</span>;
      case 'SALA_VETRI':
        return <span className={`${baseClasses} bg-indigo-100 text-indigo-800`}>Sala Vetri</span>;
      case 'SALA_VETRI_RISERVATA':
        return <span className={`${baseClasses} bg-indigo-200 text-indigo-900`}>Sala Vetri (Riservata)</span>;
      case 'ESTERNO':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Esterno</span>;
      case 'PISCINA':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Piscina</span>;
      case 'TOOCOOL':
      case 'toocool':
      case 'TOO_COOL':
      case 'too_cool':
        return <span className={`${baseClasses} bg-pink-100 text-pink-800`}>TooCool</span>;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dettagli Prenotazione #{booking.id}
                </h2>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="ml-2">
                      {status === 'CONFIRMED' && 'Confermata'}
                      {status === 'PENDING' && 'In Attesa'}
                      {status === 'CANCELLED' && 'Cancellata'}
                      {status === 'COMPLETED' && 'Completata'}
                    </span>
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Cliente */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Informazioni Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.nomeCliente}</p>
                    <p className="text-sm text-gray-500">Cliente</p>
                  </div>
                </div>
                
                {booking.telefono && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.telefono}</p>
                      <p className="text-sm text-gray-500">Telefono</p>
                    </div>
                  </div>
                )}
                
                {booking.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.email}</p>
                      <p className="text-sm text-gray-500">Email</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.numeroPersone} persone</p>
                    <p className="text-sm text-gray-500">Partecipanti</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Prenotazione */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dettagli Prenotazione</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(booking.dataOra), 'EEEE, dd MMMM yyyy', { locale: it })}
                    </p>
                    <p className="text-sm text-gray-500">Data</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(booking.dataOra), 'HH:mm')}
                    </p>
                    <p className="text-sm text-gray-500">Orario</p>
                  </div>
                </div>
                
                {booking.tipo && (
                  <div className="flex items-center text-gray-600">
                    <FileText className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{booking.tipo}</p>
                      <p className="text-sm text-gray-500">Tipo</p>
                    </div>
                  </div>
                )}
                
                {booking.sala && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                    {getSalaBadge(booking.sala)}
                  </div>
                )}
              </div>
            </div>

            {/* Dettagli Evento (se presente) */}
            {booking.tipo === 'evento' && booking.eventoDettagli && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dettagli Evento</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {booking.eventoDettagli.nomeEvento && (
                    <div>
                      <p className="text-sm text-gray-500">Nome Evento</p>
                      <p className="font-medium text-gray-900">{booking.eventoDettagli.nomeEvento}</p>
                    </div>
                  )}
                  
                  {booking.eventoDettagli.menu && (
                    <div>
                      <p className="text-sm text-gray-500">Menù</p>
                      <p className="font-medium text-gray-900">{booking.eventoDettagli.menu}</p>
                    </div>
                  )}
                  
                  {booking.eventoDettagli.allergie && (
                    <div>
                      <p className="text-sm text-gray-500">Note</p>
                      <p className="font-medium text-gray-900">{booking.eventoDettagli.allergie}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Allegati */}
            {booking.allegati && booking.allegati.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Allegati</h3>
                <div className="space-y-2">
                  {booking.allegati.map((allegato, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{allegato.nome}</p>
                          <p className="text-sm text-gray-500">{allegato.dimensione}</p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Note</h3>
              {canManageBookings() ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Aggiungi note per questa prenotazione..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleNotesUpdate}
                    disabled={loading}
                    className="btn btn-outline btn-sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Salva Note
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {booking.notes || 'Nessuna nota disponibile'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canManageBookings() && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Status Actions */}
                {status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      disabled={loading}
                      className="btn btn-primary flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Conferma
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={loading}
                      className="btn btn-outline-red flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rifiuta
                    </button>
                  </>
                )}
                
                {status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    disabled={loading}
                    className="btn btn-success flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Completa
                  </button>
                )}

                {/* Edit/Delete Actions */}
                <button
                  onClick={() => {/* Implementare edit */}}
                  className="btn btn-outline"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifica
                </button>
                
                <button
                  onClick={handleDelete}
                  className="btn btn-outline-red"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingDetailModal; 