import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Calendar, 
  User, 
  Clock,
  CheckCheck
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(pageNum, 20);
      
      if (pageNum === 1) {
        setNotifications(result.notifications);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
      }
      
      setHasMore(result.notifications.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'user':
        return <User className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notifiche
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Segna tutte come lette"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-12 h-12 mb-2 opacity-50" />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-4 hover:bg-gray-50 transition-colors relative
                    ${!notification.read ? 'bg-blue-50/50' : ''}
                  `}
                >
                  {!notification.read && (
                    <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  
                  <div className="flex gap-3 ml-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: it
                          })}
                        </span>
                        
                        <div className="flex gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-100 rounded transition-colors"
                              title="Segna come letta"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Load More */}
          {hasMore && notifications.length > 0 && (
            <div className="p-4 text-center">
              <button
                onClick={() => loadNotifications(page + 1)}
                disabled={loading}
                className="text-primary hover:text-primary-dark font-medium text-sm disabled:opacity-50"
              >
                {loading ? 'Caricamento...' : 'Carica altre'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter; 