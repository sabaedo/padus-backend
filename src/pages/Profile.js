import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Bell,
  Lock,
  Download,
  Eye,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import notificationService from '../services/notificationService';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    notificheAttive: true,
    preferenzeNotifiche: {
      prenotazioniNuove: true,
      prenotazioniModificate: true,
      prenotazioniCancellate: true,
      promemoria: true
    }
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    loadUserStats();
    loadUserActivities();
    loadNotificationPreferences();
  }, []);

  const loadUserStats = async () => {
    // Simula caricamento statistiche utente
    setStats({
      totalBookings: 23,
      confirmedBookings: 18,
      pendingBookings: 3,
      cancelledBookings: 2,
      thisMonthBookings: 8,
      avgResponseTime: '2.3h',
      customerSatisfaction: 4.7,
      workDays: 45
    });
  };

  const loadUserActivities = async () => {
    // Simula cronologia attività
    setActivities([
      {
        id: 1,
        action: 'Prenotazione confermata',
        details: 'Mario Rossi - 15 Giugno 2024',
        timestamp: new Date('2024-06-15T10:30:00'),
        type: 'confirm'
      },
      {
        id: 2,
        action: 'Prenotazione creata',
        details: 'Anna Bianchi - 4 persone',
        timestamp: new Date('2024-06-15T09:15:00'),
        type: 'create'
      },
      {
        id: 3,
        action: 'Login sistema',
        details: 'Accesso da Chrome',
        timestamp: new Date('2024-06-15T08:00:00'),
        type: 'login'
      },
      {
        id: 4,
        action: 'Prenotazione modificata',
        details: 'Giuseppe Verdi - orario cambiato',
        timestamp: new Date('2024-06-14T16:45:00'),
        type: 'update'
      },
      {
        id: 5,
        action: 'Export dati',
        details: 'Report mensile generato',
        timestamp: new Date('2024-06-14T14:20:00'),
        type: 'export'
      }
    ]);
  };

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      setNotificationPrefs(prefs);
    } catch (error) {
      console.error('Errore caricamento preferenze notifiche:', error);
    }
  };

  const updateNotificationPreference = async (key, value) => {
    setSavingPrefs(true);
    
    try {
      const newPrefs = {
        ...notificationPrefs,
        preferenzeNotifiche: {
          ...notificationPrefs.preferenzeNotifiche,
          [key]: value
        }
      };

      const success = await notificationService.updateNotificationPreferences(newPrefs);
      
      if (success) {
        setNotificationPrefs(newPrefs);
      }
    } catch (error) {
      console.error('Errore aggiornamento preferenza:', error);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleGlobalNotifications = async (enabled) => {
    setSavingPrefs(true);
    
    try {
      const newPrefs = {
        ...notificationPrefs,
        notificheAttive: enabled
      };

      const success = await notificationService.updateNotificationPreferences(newPrefs);
      
      if (success) {
        setNotificationPrefs(newPrefs);
        
        // Se le notifiche vengono attivate, richiedi permessi push
        if (enabled) {
          await notificationService.subscribe();
        } else {
          await notificationService.unsubscribe();
        }
      }
    } catch (error) {
      console.error('Errore toggle notifiche globali:', error);
    } finally {
      setSavingPrefs(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'confirm': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'create': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'update': return <Edit3 className="w-4 h-4 text-yellow-500" />;
      case 'login': return <User className="w-4 h-4 text-purple-500" />;
      case 'export': return <Download className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'info', name: 'Informazioni', icon: User },
    { id: 'stats', name: 'Statistiche', icon: TrendingUp },
    { id: 'activity', name: 'Cronologia', icon: Activity },
    { id: 'settings', name: 'Impostazioni', icon: Settings }
  ];

  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* Informazioni Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Nome Completo</p>
            <p className="font-medium text-gray-900">{user?.nome} {user?.cognome}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ruolo</p>
            <p className="font-medium text-gray-900">{user?.ruolo}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Livello Permessi</p>
            <p className="font-medium text-gray-900">{user?.permissionLevel}</p>
          </div>
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <Edit3 className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900">Modifica Profilo</h3>
          <p className="text-sm text-gray-600">Aggiorna informazioni personali</p>
        </button>

        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <Lock className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-medium text-gray-900">Cambia Password</h3>
          <p className="text-sm text-gray-600">Aggiorna credenziali di accesso</p>
        </button>

        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <Bell className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-900">Notifiche</h3>
          <p className="text-sm text-gray-600">Gestisci preferenze notifiche</p>
        </button>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Cards Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prenotazioni Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confermate</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Questo Mese</p>
              <p className="text-2xl font-bold text-primary-600">{stats.thisMonthBookings}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Risposta</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.avgResponseTime}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>
      </div>

      {/* Dettagli Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Performance Mensile</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasso Conferma</span>
                <span className="font-medium">{((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.confirmedBookings / stats.totalBookings) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Soddisfazione Cliente</span>
                <span className="font-medium">{stats.customerSatisfaction}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.customerSatisfaction / 5) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Giorni Attivi</span>
                <span className="font-medium">{stats.workDays} giorni</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Distribuzione Stati</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Confermate</span>
                </div>
                <span className="font-medium">{stats.confirmedBookings}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">In Attesa</span>
                </div>
                <span className="font-medium">{stats.pendingBookings}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Cancellate</span>
                </div>
                <span className="font-medium">{stats.cancelledBookings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Cronologia Attività</h3>
        <button className="btn btn-outline btn-sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(activity.timestamp, 'dd/MM/yyyy HH:mm', { locale: it })}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.details}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center py-4">
        <button className="btn btn-outline">
          <Eye className="w-4 h-4 mr-2" />
          Carica Altri
        </button>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Notifiche Globali */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifiche Globali</h3>
            {savingPrefs && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Attiva Notifiche</p>
              <p className="text-sm text-gray-600">Abilita/disabilita tutte le notifiche push e browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationPrefs.notificheAttive}
                onChange={(e) => toggleGlobalNotifications(e.target.checked)}
                disabled={savingPrefs}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preferenze Specifiche */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Preferenze Notifiche</h3>
        </div>
        <div className="card-body space-y-4">
          {[
            { 
              key: 'prenotazioniNuove', 
              label: 'Nuove Prenotazioni', 
              description: 'Ricevi notifiche per prenotazioni appena create' 
            },
            { 
              key: 'prenotazioniModificate', 
              label: 'Prenotazioni Modificate', 
              description: 'Notifiche quando una prenotazione viene cambiata' 
            },
            { 
              key: 'prenotazioniCancellate', 
              label: 'Prenotazioni Cancellate', 
              description: 'Avvisi per prenotazioni cancellate dai clienti' 
            },
            { 
              key: 'promemoria', 
              label: 'Promemoria', 
              description: 'Promemoria automatici per appuntamenti imminenti' 
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className={notificationPrefs.notificheAttive ? '' : 'opacity-50'}>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notificationPrefs.preferenzeNotifiche[setting.key] && notificationPrefs.notificheAttive}
                  onChange={(e) => updateNotificationPreference(setting.key, e.target.checked)}
                  disabled={savingPrefs || !notificationPrefs.notificheAttive}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sicurezza */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Sicurezza</h3>
        </div>
        <div className="card-body space-y-4">
          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Cambia Password</h4>
                <p className="text-sm text-gray-600">Ultima modifica: 30 giorni fa</p>
              </div>
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Autenticazione a 2 Fattori</h4>
                <p className="text-sm text-gray-600">Non configurata</p>
              </div>
              <Shield className="w-5 h-5 text-yellow-500" />
            </div>
          </button>

          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Sessioni Attive</h4>
                <p className="text-sm text-gray-600">3 dispositivi connessi</p>
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profilo Staff</h1>
            <p className="text-gray-600 mt-1">Gestisci profilo, statistiche e impostazioni</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.nome?.[0]}{user?.cognome?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.nome} {user?.cognome}</p>
                <p className="text-sm text-gray-600">{user?.permissionLevel}</p>
              </div>
            </div>
          </div>
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
          className="card"
        >
          <div className="card-body">
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'stats' && renderStatsTab()}
            {activeTab === 'activity' && renderActivityTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile; 