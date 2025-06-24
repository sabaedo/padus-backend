import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Settings,
  FileText,
  Download,
  UserPlus,
  Shield,
  Bell,
  TrendingUp
} from 'lucide-react';
import AdvancedStats from '../components/admin/AdvancedStats';
import Calendar from '../components/ui/Calendar';
import notificationService from '../services/notificationService';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, canViewDashboard } = useAuth();

  if (!canViewDashboard()) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Accesso negato</div>
        <p className="text-gray-600 mt-2">Non hai i permessi per accedere a questa sezione</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Panoramica', icon: BarChart3 },
    { id: 'stats', name: 'Statistiche', icon: TrendingUp },
    { id: 'bookings', name: 'Prenotazioni', icon: Calendar },
    { id: 'users', name: 'Staff', icon: Users },
    { id: 'settings', name: 'Impostazioni', icon: Settings }
  ];

  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      // API call to update booking
      console.log('Update booking:', bookingId, updates);
      notificationService.showSuccess('Prenotazione aggiornata');
    } catch (error) {
      notificationService.showError('Errore aggiornamento prenotazione');
    }
  };

  const handleBookingDelete = async (bookingId) => {
    try {
      // API call to delete booking
      console.log('Delete booking:', bookingId);
      notificationService.showSuccess('Prenotazione eliminata');
    } catch (error) {
      notificationService.showError('Errore eliminazione prenotazione');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">247</p>
                <p className="text-gray-600 text-sm">Prenotazioni Totali</p>
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+15.3% questo mese</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">12</p>
                <p className="text-gray-600 text-sm">In Attesa</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-gray-600">Richiedono conferma</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">8</p>
                <p className="text-gray-600 text-sm">Staff Attivo</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-gray-600">2 Admin, 6 Staff</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">€12.4k</p>
                <p className="text-gray-600 text-sm">Ricavi Mese</p>
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+8.2% vs mese scorso</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Azioni Rapide</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => setActiveTab('bookings')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Calendar className="w-8 h-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Gestisci Prenotazioni</h3>
              <p className="text-sm text-gray-600">Visualizza e gestisci calendario</p>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Analizza Dati</h3>
              <p className="text-sm text-gray-600">Statistiche e grafici avanzati</p>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Gestisci Staff</h3>
              <p className="text-sm text-gray-600">Permessi e utenti</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Download className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Export Dati</h3>
              <p className="text-sm text-gray-600">PDF e CSV report</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Attività Recente</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { action: 'Nuova prenotazione', user: 'Mario Rossi', time: '5 min fa', type: 'booking' },
                { action: 'Prenotazione confermata', user: 'Admin', time: '12 min fa', type: 'confirm' },
                { action: 'Nuovo staff aggiunto', user: 'Laura Bianchi', time: '1h fa', type: 'user' },
                { action: 'Export dati generato', user: 'Admin', time: '2h fa', type: 'export' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'confirm' ? 'bg-green-100 text-green-600' :
                    activity.type === 'user' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'booking' && <Calendar className="w-4 h-4" />}
                    {activity.type === 'confirm' && <Shield className="w-4 h-4" />}
                    {activity.type === 'user' && <UserPlus className="w-4 h-4" />}
                    {activity.type === 'export' && <Download className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Prossimi Promemoria</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { task: 'Confermare 5 prenotazioni', due: 'Entro oggi', priority: 'high' },
                { task: 'Review mensile staff', due: 'Domani', priority: 'medium' },
                { task: 'Backup database', due: 'Lunedì', priority: 'low' },
                { task: 'Aggiornamento sistema', due: 'Settimana prossima', priority: 'medium' }
              ].map((reminder, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reminder.task}</p>
                    <p className="text-xs text-gray-500">{reminder.due}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
                    reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {reminder.priority === 'high' ? 'Urgente' :
                     reminder.priority === 'medium' ? 'Normale' : 'Bassa'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pannello Amministrazione</h1>
        <p className="text-gray-600 mt-1">Gestione completa sistema prenotazioni PADUS</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && renderOverview()}
        
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiche Avanzate</h2>
            <AdvancedStats />
          </div>
        )}
        
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestione Prenotazioni</h2>
            <Calendar
              bookings={[]} // Qui andrebbero i dati reali
              onBookingUpdate={handleBookingUpdate}
              onBookingDelete={handleBookingDelete}
            />
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Gestione Staff</h2>
            </div>
            <div className="card-body">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestione Staff</h3>
                <p className="text-gray-600 mb-4">
                  Funzionalità per gestire permessi, ruoli e utenti staff
                </p>
                <button className="btn btn-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Aggiungi Staff
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Impostazioni Sistema</h2>
            </div>
            <div className="card-body">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configurazioni</h3>
                <p className="text-gray-600">
                  Impostazioni globali, notifiche, backup e sicurezza
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPanel; 