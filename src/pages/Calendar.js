import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Users,
  PartyPopper,
  Clock,
  Phone,
  X,
  ArrowLeft,
  Home,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([
    // Prenotazioni di esempio con date reali
    {
      id: 1,
      tipo: 'normale',
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 334 567 890',
      adulti: 4,
      bambini: 0,
      orario: '20:00',
      data: new Date(2024, 11, 15), // 15 Dicembre 2024
      stato: 'confermata'
    },
    {
      id: 2,
      tipo: 'evento',
      nomeEvento: 'Compleanno Anna',
      partecipanti: 12,
      tipoMenu: 'fisso',
      allergie: 'Nessuna',
      pacchetto: 'premium',
      orario: '19:30',
      data: new Date(2024, 11, 18), // 18 Dicembre 2024
      stato: 'in_attesa'
    },
    {
      id: 3,
      tipo: 'normale',
      nome: 'Giulia',
      cognome: 'Bianchi', 
      telefono: '+39 389 123 456',
      adulti: 2,
      bambini: 1,
      orario: '19:00',
      data: new Date(2024, 11, 20), // 20 Dicembre 2024
      stato: 'confermata'
    }
  ]);

  // Giorni della settimana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  // Mesi
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Funzioni per navigazione mese
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Genera giorni del mese
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // Ottieni prenotazioni per una data
  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.data);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  // Simula notifica push a tutti gli utenti
  const sendNotificationToAllUsers = (booking) => {
    console.log('🔔 Notifica inviata a tutti gli utenti registrati:', {
      tipo: 'nuova_prenotazione',
      messaggio: booking.tipo === 'normale' 
        ? `Nuova prenotazione: ${booking.nome} ${booking.cognome} per ${booking.adulti + booking.bambini} persone`
        : `Nuovo evento: ${booking.nomeEvento} per ${booking.partecipanti} partecipanti`,
      data: booking.data,
      orario: booking.orario
    });
    
    toast.success('📢 Nuova prenotazione aggiunta!', {
      duration: 3000,
      icon: '🔔'
    });
  };

  // Listener per nuove prenotazioni
  useEffect(() => {
    const handleNewBooking = (event) => {
      if (event.detail) {
        const newBooking = {
          ...event.detail,
          id: Date.now(), // ID unico
          data: new Date(event.detail.data)
        };
        
        setBookings(prev => [...prev, newBooking]);
        sendNotificationToAllUsers(newBooking);
        
        // Naviga al mese della prenotazione
        setCurrentDate(new Date(newBooking.data));
        setSelectedDate(new Date(newBooking.data));
      }
    };

    window.addEventListener('new-booking', handleNewBooking);
    
    return () => {
      window.removeEventListener('new-booking', handleNewBooking);
    };
  }, []);

  const calendarDays = generateCalendarDays();

  // Modal dettagli prenotazione
  const BookingModal = () => {
    if (!selectedBooking) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          padding: '32px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          {/* Header Modal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Dettagli Prenotazione
            </h3>
            <button
              onClick={() => setSelectedBooking(null)}
              style={{
                padding: '8px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.1)',
                cursor: 'pointer'
              }}
            >
              <X size={20} style={{ color: '#ef4444' }} />
            </button>
          </div>

          {/* Tipo Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '20px',
            background: selectedBooking.tipo === 'normale' 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(245, 158, 11, 0.2)',
            color: selectedBooking.tipo === 'normale' ? '#3b82f6' : '#f59e0b',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '24px'
          }}>
            {selectedBooking.tipo === 'normale' ? 'Prenotazione Normale' : 'Prenotazione Evento'}
          </div>

          {/* Dettagli */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {selectedBooking.tipo === 'normale' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Nome</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.nome}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Cognome</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.cognome}
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Telefono</label>
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#1e293b', 
                    fontWeight: '600', 
                    margin: '4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Phone size={16} style={{ color: '#64748b' }} />
                    {selectedBooking.telefono}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Adulti</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.adulti}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Bambini</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.bambini}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Totale</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700', margin: '4px 0 0' }}>
                      {selectedBooking.adulti + selectedBooking.bambini} persone
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Nome Evento</label>
                  <p style={{ fontSize: '18px', color: '#1e293b', fontWeight: '700', margin: '4px 0 0' }}>
                    {selectedBooking.nomeEvento}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Partecipanti</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.partecipanti} persone
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Tipo Menù</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.tipoMenu}
                    </p>
                  </div>
                </div>

                {selectedBooking.allergie && (
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Allergie</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.allergie}
                    </p>
                  </div>
                )}

                {selectedBooking.pacchetto && (
                  <div>
                    <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Pacchetto</label>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '4px 0 0' }}>
                      {selectedBooking.pacchetto}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Data e Ora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Data</label>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#1e293b', 
                  fontWeight: '600', 
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CalendarIcon size={16} style={{ color: '#64748b' }} />
                  {selectedBooking.data.toLocaleDateString('it-IT')}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Orario</label>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#1e293b', 
                  fontWeight: '600', 
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={16} style={{ color: '#64748b' }} />
                  {selectedBooking.orario}
                </p>
              </div>
            </div>

            {/* Stato */}
            <div>
              <label style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Stato</label>
              <div style={{
                marginTop: '4px',
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '12px',
                background: selectedBooking.stato === 'confermata' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(245, 158, 11, 0.2)',
                color: selectedBooking.stato === 'confermata' ? '#10b981' : '#f59e0b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {selectedBooking.stato === 'confermata' ? 'Confermata' : 'In Attesa'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)',
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '32px'
    }}>
      {/* Navigation Header */}
      <div style={{
        padding: '16px 24px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b'
            }}
          >
            <ArrowLeft size={16} style={{ color: '#3b82f6' }} />
            Dashboard
          </button>
          
          <div style={{
            height: '24px',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.3)'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.2)'
            }}>
              <CalendarIcon size={20} style={{ color: '#3b82f6' }} />
            </div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0'
            }}>
              PADUS - Calendario Prenotazioni
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.2)'
            }}>
              <UserIcon size={16} style={{ color: '#3b82f6' }} />
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              {user?.nome} {user?.cognome}
            </span>
          </div>
          
          <div style={{
            height: '24px',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.3)'
          }} />
          
          <button
            onClick={() => {
              // Chiamiamo logout dal context
              window.location.href = '/auth';
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.2)',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} style={{ color: '#ef4444' }} />
          </button>
        </div>
             </div>

      {/* Action Header */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={{
            color: 'rgba(30, 41, 59, 0.7)',
            fontSize: '14px',
            margin: '0'
          }}>
            Visualizza e gestisci tutte le prenotazioni del ristorante
          </p>
        </div>

        <button
          onClick={() => navigate('/booking')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          Nuova Prenotazione
        </button>
      </div>

      {/* Controlli Calendario */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} style={{ color: '#3b82f6' }} />
          </button>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0',
            minWidth: '220px',
            textAlign: 'center'
          }}>
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={goToNextMonth}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} style={{ color: '#3b82f6' }} />
          </button>
        </div>

        <button
          onClick={goToToday}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(59, 130, 246, 0.3)',
            color: '#1e293b',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Oggi
        </button>
      </div>

      {/* Calendario */}
      <div style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        marginBottom: '24px'
      }}>
        {/* Header giorni settimana */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '16px'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              padding: '16px 8px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '12px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px'
        }}>
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const dayBookings = getBookingsForDate(date);

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                style={{
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: isSelected 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : isToday 
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.15)',
                  border: isToday ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isCurrentMonth ? 1 : 0.5
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: isToday ? '800' : '600',
                  color: isToday ? '#10b981' : '#1e293b',
                  marginBottom: '8px'
                }}>
                  {date.getDate()}
                </div>

                {/* Prenotazioni del giorno */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayBookings.slice(0, 2).map(booking => (
                    <div
                      key={booking.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: booking.tipo === 'normale' 
                          ? 'rgba(59, 130, 246, 0.9)' 
                          : 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      {booking.orario} - {booking.tipo === 'normale' 
                        ? `${booking.nome} (${booking.adulti + booking.bambini}p)`
                        : booking.nomeEvento
                      }
                    </div>
                  ))}
                  
                  {dayBookings.length > 2 && (
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      +{dayBookings.length - 2} altre...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dettagli giorno selezionato */}
      {selectedDate && (
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Prenotazioni del {selectedDate.toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>

          {getBookingsForDate(selectedDate).length === 0 ? (
            <p style={{
              color: 'rgba(30, 41, 59, 0.6)',
              fontSize: '16px',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px'
            }}>
              Nessuna prenotazione per questo giorno
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {getBookingsForDate(selectedDate).map(booking => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: booking.tipo === 'normale' 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'rgba(245, 158, 11, 0.2)'
                  }}>
                    {booking.tipo === 'normale' ? (
                      <Users size={24} style={{ color: '#3b82f6' }} />
                    ) : (
                      <PartyPopper size={24} style={{ color: '#f59e0b' }} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: '0 0 4px 0'
                    }}>
                      {booking.tipo === 'normale' 
                        ? `${booking.nome} ${booking.cognome}`
                        : booking.nomeEvento
                      }
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(30, 41, 59, 0.7)',
                      margin: '0'
                    }}>
                      {booking.orario} • {booking.tipo === 'normale' 
                        ? `${booking.adulti + booking.bambini} persone • ${booking.telefono}`
                        : `${booking.partecipanti} partecipanti • Menù ${booking.tipoMenu}`
                      }
                    </p>
                  </div>

                  <div style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    background: booking.stato === 'confermata' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(245, 158, 11, 0.2)',
                    color: booking.stato === 'confermata' ? '#10b981' : '#f59e0b',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {booking.stato === 'confermata' ? 'Confermata' : 'In Attesa'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Dettagli */}
      <BookingModal />
    </div>
  );
};

export default Calendar; 