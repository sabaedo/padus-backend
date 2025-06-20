import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../ui/NotificationCenter';
import Toast from '../ui/Toast';
import notificationService from '../../services/notificationService';
import { 
  Menu, 
  X, 
  Calendar, 
  Plus, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Bell,
  Home
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, isAdmin, canViewDashboard } = useAuth();

  // Inizializza le notifiche push
  useEffect(() => {
    const initNotifications = async () => {
      await notificationService.init();
      
      // Verifica se l'utente ha già dato il permesso
      if (Notification.permission === 'granted') {
        await notificationService.subscribe();
      }
    };

    initNotifications();
  }, []);

  // Simula conteggio notifiche non lette
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const result = await notificationService.getNotifications(1, 1);
        const mockUnread = Math.floor(Math.random() * 5); // Simulazione
        setUnreadCount(mockUnread);
      } catch (error) {
        console.error('Errore caricamento notifiche:', error);
      }
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000); // Aggiorna ogni 30s

    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Calendario', href: '/calendar', icon: Calendar },
    { name: 'Nuova Prenotazione', href: '/prenotazioni/nuova', icon: Plus },
    { name: 'Profilo', href: '/profilo', icon: User },
  ];

  if (canViewDashboard()) {
    navigation.push({ name: 'Pannello Admin', href: '/admin', icon: Shield });
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            {/* Logo e toggle mobile */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center ml-4 lg:ml-0">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gradient">PADUS</span>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Notifiche */}
              <button 
                onClick={() => setNotificationCenterOpen(true)}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              {/* User profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.nome} {user?.cognome}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.permissionLevel}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black opacity-50" onClick={toggleSidebar} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`sidebar ${sidebarOpen ? '' : 'sidebar-mobile-hidden'}`}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={toggleSidebar}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Versione 1.0.0</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16">
        <main className="py-6">
          <motion.div
            className="container-app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
};

export default Layout; 