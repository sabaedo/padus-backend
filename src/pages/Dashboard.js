import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Calendar from '../components/ui/Calendar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalBookings: 24,
    pendingBookings: 8,
    confirmedBookings: 14,
    rejectedBookings: 2
  });

  // Mock data prenotazioni per il calendario
  const mockBookings = [
    {
      id: 1,
      tipo: 'NORMALE',
      nomeCliente: 'Mario Rossi',
      cognomeCliente: '',
      dataPrenotazione: '2024-12-10',
      orarioArrivo: '19:30',
      numeroPersone: 4,
      stato: 'IN_ATTESA'
    },
    {
      id: 2,
      tipo: 'NORMALE', 
      nomeCliente: 'Anna Verdi',
      cognomeCliente: '',
      dataPrenotazione: '2024-12-09',
      orarioArrivo: '20:00',
      numeroPersone: 2,
      stato: 'CONFERMATA'
    },
    {
      id: 3,
      tipo: 'EVENTO',
      nomeEvento: 'Festa Compleanno',
      dataPrenotazione: '2024-12-12',
      orarioArrivo: '19:00',
      partecipanti: 15,
      stato: 'CONFERMATA'
    },
    {
      id: 4,
      tipo: 'NORMALE',
      nomeCliente: 'Luca Bianchi',
      cognomeCliente: '',
      dataPrenotazione: '2024-12-08',
      orarioArrivo: '21:00',
      numeroPersone: 6,
      stato: 'RIFIUTATA'
    }
  ];

  const recentBookings = mockBookings.slice(0, 3);

  const getStatusBadge = (status) => {
    const badges = {
      'IN_ATTESA': 'badge-pending',
      'CONFERMATA': 'badge-confirmed',
      'RIFIUTATA': 'badge-rejected'
    };
    
    const labels = {
      'IN_ATTESA': 'In Attesa',
      'CONFERMATA': 'Confermata',
      'RIFIUTATA': 'Rifiutata'
    };

    return (
      <span className={`badge ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleBookingClick = (booking) => {
    console.log('Prenotazione selezionata:', booking);
    // TODO: Aprire modal dettagli prenotazione
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Benvenuto
          </h1>
          <p className="text-gray-600 mt-1">
            Ecco una panoramica delle tue prenotazioni
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button 
            variant="outline"
            icon={<CalendarIcon className="w-4 h-4" />}
            onClick={() => navigate('/calendar')}
          >
            Calendario
          </Button>
          <Button 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/prenotazioni/nuova')}
          >
            Nuova Prenotazione
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                <p className="text-gray-600 text-sm">Prenotazioni Totali</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingBookings}</p>
                <p className="text-gray-600 text-sm">In Attesa</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.confirmedBookings}</p>
                <p className="text-gray-600 text-sm">Confermate</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.rejectedBookings}</p>
                <p className="text-gray-600 text-sm">Rifiutate</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Calendario Principale */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            bookings={mockBookings}
            onBookingClick={handleBookingClick}
          />
        </div>

        {/* Sidebar Prenotazioni Recenti */}
        <div className="xl:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Prenotazioni Recenti</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    className="p-4 bg-gray-50 rounded-lg cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {booking.tipo === 'EVENTO' ? booking.nomeEvento : `${booking.nomeCliente}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            #{booking.id}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.stato)}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Data:</span>
                        <span>{new Date(booking.dataPrenotazione).toLocaleDateString('it-IT')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Ora:</span>
                        <span>{booking.orarioArrivo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Persone:</span>
                        <span>{booking.numeroPersone || booking.partecipanti}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/prenotazioni')}
              >
                Vedi Tutte
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Statistiche Rapide</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Oggi</span>
                  <span className="font-medium">3 prenotazioni</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Questa settimana</span>
                  <span className="font-medium">12 prenotazioni</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Questo mese</span>
                  <span className="font-medium">45 prenotazioni</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tasso conferma</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 