import { useNotifications } from '../contexts/NotificationContext';
import { X, Check, CheckCheck, Trash2, ExternalLink, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);
    
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type and available data
    if (notification.actionButton?.link) {
      let targetLink = notification.actionButton.link;
      
      console.log('📍 Initial link:', targetLink);
      console.log('📋 Notification type:', notification.type);
      console.log('🏷️ Notification title:', notification.title);
      
      // Handle payout/KYC notifications - navigate to profile with payout section
      if (notification.type === 'kyc_pending' || 
          notification.title.toLowerCase().includes('payout') || 
          notification.title.toLowerCase().includes('kyc') ||
          notification.message.toLowerCase().includes('bank details')) {
        targetLink = '/profile?section=payout';
        console.log('💳 Detected payout notification, navigating to:', targetLink);
      }
      // Handle ticket-related notifications - navigate to user dashboard with specific eventId
      else if (notification.type === 'booking_confirmed' || 
          notification.type === 'checkin_qr_ready' || 
          targetLink.startsWith('/tickets/')) {
        // Get the event ID from relatedEvent to auto-open that specific ticket
        const eventId = notification.relatedEvent?._id || notification.relatedEvent;
        targetLink = eventId ? `/user/dashboard?eventId=${eventId}` : '/user/dashboard';
      }
      // Handle related event links if present
      else if (notification.relatedEvent?._id && targetLink.includes('/events/')) {
        targetLink = `/event/${notification.relatedEvent._id}`;
      }
      
      console.log('🚀 Final navigation target:', targetLink);
      navigate(targetLink);
      onClose();
    } else {
      console.log('⚠️ No action button link found');
    }
  };

  const getNotificationIcon = (notification) => {
    const emoji = notification.metadata?.emoji;
    if (emoji) return emoji;
    
    // Default icons based on category
    const categoryIcons = {
      action_required: '🔴',
      status_update: '🔵',
      reminder: '⏰',
      milestone: '🎯'
    };
    
    return categoryIcons[notification.category] || '📢';
  };

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p style={{ fontFamily: 'Source Serif Pro, serif' }}>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {getTimeAgo(notification.createdAt)}
                      </span>

                      {notification.actionButton && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          {notification.actionButton.text}
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
