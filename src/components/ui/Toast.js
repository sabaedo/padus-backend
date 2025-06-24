import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import notificationService from '../../services/notificationService';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const removeListener = notificationService.addToastListener((toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.remove));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    });

    return removeListener;
  }, []);

  const removeToast = (toastId) => {
    notificationService.removeToast(toastId);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
              pointer-events-auto transform hover:scale-105 transition-transform
              ${getToastStyles(toast.type)}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getToastIcon(toast.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {toast.message}
              </p>
              {toast.timestamp && (
                <p className="text-xs opacity-70 mt-1">
                  {toast.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast; 