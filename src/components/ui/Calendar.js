import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Filter,
  Grid3X3,
  Calendar1,
  CalendarDays
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  isSameMonth,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  startOfDay,
  endOfDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import Button from './Button';
import BookingDetailModal from './BookingDetailModal';

const Calendar = ({ onDateSelect, selectedDate, bookings = [], onBookingClick, onBookingUpdate, onBookingDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    showPending: true,
    showConfirmed: true,
    showRejected: true,
    typeFilter: 'all'
  });

  // Calcola date di inizio e fine basate sulla vista
  const getDateRange = () => {
    switch (view) {
      case 'week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        };
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      default: // month
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const start = new Date(monthStart);
        start.setDate(start.getDate() - monthStart.getDay() + 1);
        const end = new Date(monthEnd);
        end.setDate(end.getDate() + (7 - monthEnd.getDay()));
        return { start, end };
    }
  };

  const { start, end } = getDateRange();
  const calendarDays = eachDayOfInterval({ start, end });

  const navigate = (direction) => {
    setCurrentDate(prev => {
      switch (view) {
        case 'week':
          return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1);
        case 'day':
          return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1);
        default:
          return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
      }
    });
  };

  const getBookingsForDay = (day) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.dataOra), day)
    );
  };

  const getBookingsForHour = (day, hour) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.dataOra);
      return isSameDay(bookingDate, day) && bookingDate.getHours() === hour;
    });
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
    if (onBookingClick) onBookingClick(booking);
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || colors['PENDING'];
  };

  const getViewTitle = () => {
    switch (view) {
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: it });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: it });
    }
  };

  // Rendering per vista mese (esistente)
  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden mb-4">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              className={`
                calendar-cell relative min-h-[120px] p-2
                ${isDayToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                ${isSelected ? 'bg-primary/10' : ''}
                ${!isCurrentMonth ? 'opacity-40' : ''}
                hover:bg-gray-50 cursor-pointer
              `}
              onClick={() => onDateSelect && onDateSelect(day)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isDayToday ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-1">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className={`
                        px-2 py-1 rounded text-xs cursor-pointer border
                        ${getStatusColor(booking.status)}
                        hover:shadow-sm transition-shadow
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">
                          {format(new Date(booking.dataOra), 'HH:mm')}
                        </span>
                      </div>
                      <div className="truncate font-medium">
                        {booking.nomeCliente}
                      </div>
                    </div>
                  ))}
                  
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayBookings.length - 3} altro/i
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );

  // Rendering per vista settimana
  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });

    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header giorni */}
          <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
            <div className="bg-gray-50 p-3"></div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="bg-gray-50 p-3 text-center">
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE', { locale: it })}
                </div>
                <div className={`text-lg font-bold ${
                  isToday(day) ? 'text-primary-600' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Griglia orari */}
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {/* Colonna orario */}
                <div className="bg-white p-2 text-center text-sm text-gray-500 border-r">
                  {hour}:00
                </div>
                
                {/* Celle per ogni giorno */}
                {weekDays.map((day) => {
                  const hourBookings = getBookingsForHour(day, hour);
                  
                  return (
                    <div 
                      key={`${day.toISOString()}-${hour}`}
                      className="bg-white p-1 min-h-[60px] hover:bg-gray-50 cursor-pointer"
                      onClick={() => onDateSelect && onDateSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                    >
                      {hourBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`
                            text-xs p-1 rounded mb-1 cursor-pointer
                            ${getStatusColor(booking.status)}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <div className="font-medium truncate">
                            {booking.nomeCliente}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {booking.numeroPersone}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Rendering per vista giorno
  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8);
    const dayBookings = getBookingsForDay(currentDate);

    return (
      <div className="space-y-2">
        {/* Header giorno */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: it })}
          </h3>
          <p className="text-sm text-gray-600">
            {dayBookings.length} prenotazione/i
          </p>
        </div>

        {/* Timeline orari */}
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourBookings = getBookingsForHour(currentDate, hour);
            
            return (
              <div key={hour} className="flex">
                <div className="w-16 text-right pr-4 text-sm text-gray-500 py-3">
                  {hour}:00
                </div>
                <div className="flex-1 border-l border-gray-200 pl-4">
                  {hourBookings.length > 0 ? (
                    <div className="space-y-2">
                      {hourBookings.map((booking) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            p-3 rounded-lg cursor-pointer border-l-4
                            ${getStatusColor(booking.status)}
                          `}
                          onClick={() => handleBookingClick(booking)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{booking.nomeCliente}</h4>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {format(new Date(booking.dataOra), 'HH:mm')}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {booking.numeroPersone} persone
                                </span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status === 'CONFIRMED' && 'Confermata'}
                              {booking.status === 'PENDING' && 'In Attesa'}
                              {booking.status === 'CANCELLED' && 'Cancellata'}
                              {booking.status === 'COMPLETED' && 'Completata'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-3 text-gray-400 text-sm">
                      Nessuna prenotazione
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {getViewTitle()}
              </h2>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('prev')}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Oggi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('next')}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Selettore vista */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'month'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-4 h-4 inline mr-1" />
              Mese
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'week'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 inline mr-1" />
              Settimana
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'day'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar1 className="w-4 h-4 inline mr-1" />
              Giorno
            </button>
          </div>
        </div>

        {/* Filtri */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filtri:</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showPending}
                onChange={(e) => setFilters(prev => ({...prev, showPending: e.target.checked}))}
                className="rounded text-yellow-600"
              />
              <span className="text-sm text-gray-600">In Attesa</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showConfirmed}
                onChange={(e) => setFilters(prev => ({...prev, showConfirmed: e.target.checked}))}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-600">Confermate</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showRejected}
                onChange={(e) => setFilters(prev => ({...prev, showRejected: e.target.checked}))}
                className="rounded text-red-600"
              />
              <span className="text-sm text-gray-600">Cancellate</span>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="card-body">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Modal Dettagli */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBooking(null);
        }}
        onUpdate={onBookingUpdate}
        onDelete={onBookingDelete}
      />
    </div>
  );
};

export default Calendar; 