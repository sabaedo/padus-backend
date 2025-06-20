import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BookingWizard from '../components/forms/BookingWizard';
import { CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const BookingForm = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  const handleComplete = (booking) => {
    setCompletedBooking(booking);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (showSuccess) {
    return (
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card">
          <div className="card-body py-12">
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Prenotazione Creata con Successo!
            </h2>
            
            <p className="text-gray-600 mb-6">
              La tua prenotazione è stata inviata e riceverai una notifica quando sarà processata.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                Torna alla Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  setCompletedBooking(null);
                }}
              >
                Nuova Prenotazione
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Prenotazione</h1>
        <p className="text-gray-600 mt-1">
          Utilizza il wizard guidato per creare la tua prenotazione
        </p>
      </div>

      <BookingWizard 
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </motion.div>
  );
};

export default BookingForm; 