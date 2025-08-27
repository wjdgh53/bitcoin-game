// Real-time notification system

'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'achievement' | 'trade' | 'price_alert' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after milliseconds
  persistent?: boolean; // Don't auto-dismiss
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

interface NotificationSystemProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationSystem({ 
  maxNotifications = 5, 
  position = 'top-right' 
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for global notification events
  useEffect(() => {
    const handleNotification = (event: CustomEvent<Notification>) => {
      addNotification(event.detail);
    };

    window.addEventListener('show-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('show-notification', handleNotification as EventListener);
    };
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      
      // Limit the number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      
      return updated;
    });

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent) {
      const duration = notification.duration || getDefaultDuration(notification.type);
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getDefaultDuration = (type: Notification['type']): number => {
    switch (type) {
      case 'error':
        return 8000; // 8 seconds
      case 'warning':
        return 6000; // 6 seconds
      case 'achievement':
        return 10000; // 10 seconds
      case 'success':
      case 'trade':
        return 5000; // 5 seconds
      default:
        return 4000; // 4 seconds
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
        positionClasses[position]
      )}
    >
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationCard({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: () => void; 
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return <Trophy className="h-5 w-5" />;
      case 'trade':
        return <TrendingUp className="h-5 w-5" />;
      case 'price_alert':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <X className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'trade':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-lg transition-all duration-300 transform',
        'animate-in slide-in-from-right-full',
        getStyles()
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  className={cn(
                    'text-xs px-2 py-1 rounded font-medium',
                    action.variant === 'primary'
                      ? 'bg-current text-white bg-opacity-20'
                      : 'bg-black bg-opacity-10 hover:bg-opacity-20'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="mt-2 text-xs opacity-75">
            {notification.timestamp.toLocaleTimeString()}
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black hover:bg-opacity-10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Notification helper functions
export const showNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  const event = new CustomEvent('show-notification', {
    detail: {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    },
  });
  
  window.dispatchEvent(event);
};

export const showAchievementNotification = (title: string, description: string, points: number) => {
  showNotification({
    type: 'achievement',
    title: `🏆 ${title}`,
    message: `${description} (+${points} XP)`,
    duration: 10000,
    actions: [
      {
        label: 'View Achievements',
        action: () => window.location.href = '/achievements',
        variant: 'primary'
      }
    ]
  });
};

export const showTradeNotification = (type: 'buy' | 'sell', amount: number, price: number) => {
  const action = type === 'buy' ? 'Bought' : 'Sold';
  showNotification({
    type: 'trade',
    title: `Trade Executed`,
    message: `${action} ${amount} BTC at $${price.toFixed(2)}`,
    actions: [
      {
        label: 'View Portfolio',
        action: () => window.location.href = '/portfolio',
        variant: 'primary'
      }
    ]
  });
};

export const showPriceAlertNotification = (price: number, targetPrice: number) => {
  const direction = price >= targetPrice ? 'reached' : 'dropped to';
  showNotification({
    type: 'price_alert',
    title: 'Price Alert',
    message: `Bitcoin has ${direction} $${price.toFixed(2)}`,
    actions: [
      {
        label: 'Trade Now',
        action: () => window.location.href = '/trade',
        variant: 'primary'
      }
    ]
  });
};

export const showErrorNotification = (title: string, message: string) => {
  showNotification({
    type: 'error',
    title,
    message,
    persistent: true,
  });
};

export const showSuccessNotification = (title: string, message: string) => {
  showNotification({
    type: 'success',
    title,
    message,
  });
};

// Hook for using notifications in components
export function useNotifications() {
  return {
    showNotification,
    showAchievementNotification,
    showTradeNotification,
    showPriceAlertNotification,
    showErrorNotification,
    showSuccessNotification,
  };
}