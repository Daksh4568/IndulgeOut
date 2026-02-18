import { useNotifications } from '../contexts/NotificationContext';
import { X, Check, CheckCheck, Trash2, ExternalLink, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isThisWeek, isAfter, subWeeks } from 'date-fns';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  // Group notifications by time period
  const groupedNotifications = () => {
    const today = [];
    const thisWeek = [];
    const lastWeek = [];

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      
      if (isToday(date)) {
        today.push(notification);
      } else if (isThisWeek(date, { weekStartsOn: 0 })) {
        thisWeek.push(notification);
      } else if (isAfter(date, subWeeks(new Date(), 2))) {
        lastWeek.push(notification);
      }
    });

    return { today, thisWeek, lastWeek };
  };

  const groups = groupedNotifications();

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);
    
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    let targetLink = notification.actionButton?.link || null;
    
    console.log('📍 Initial link:', targetLink);
    console.log('📋 Notification type:', notification.type);
    console.log('🏷️ Notification title:', notification.title);
    
    // Handle "Complete Your Host Profile" notifications - navigate to profile page
    if (notification.title.toLowerCase().includes('complete your') && 
        notification.title.toLowerCase().includes('profile')) {
      targetLink = '/profile';
      console.log('👤 Detected profile completion notification, navigating to:', targetLink);
    }
    // Handle payout/KYC notifications - navigate to profile with payout section
    else if (notification.type === 'kyc_pending' || 
        notification.title.toLowerCase().includes('payout') || 
        notification.title.toLowerCase().includes('kyc') ||
        notification.message.toLowerCase().includes('bank details')) {
      targetLink = '/profile?section=payout';
      console.log('💳 Detected payout notification, navigating to:', targetLink);
    }
    // Handle ticket-related notifications - navigate to user dashboard with specific eventId
    else if (notification.type === 'booking_confirmed' || 
        notification.type === 'checkin_qr_ready' || 
        (targetLink && targetLink.startsWith('/tickets/'))) {
      // Get the event ID from relatedEvent to auto-open that specific ticket
      const eventId = notification.relatedEvent?._id || notification.relatedEvent;
      targetLink = eventId ? `/user/dashboard?eventId=${eventId}` : '/user/dashboard';
    }
    // Handle related event links if present
    else if (notification.relatedEvent?._id && targetLink && targetLink.includes('/events/')) {
      targetLink = `/event/${notification.relatedEvent._id}`;
    }
    
    // Navigate if we have a target link
    if (targetLink) {
      console.log('🚀 Final navigation target:', targetLink);
      navigate(targetLink);
      onClose();
    } else {
      console.log('⚠️ No navigation target determined for this notification');
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
    <div className="sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 bg-black rounded-lg shadow-2xl border border-gray-800 fixed sm:absolute right-[0.5rem] sm:right-0 top-16 sm:top-auto z-[60]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
            NOTIFICATIONS
          </h3>
          {unreadCount > 0 && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              You have <span className="text-blue-400 font-semibold">{unreadCount} unread</span> notifications today
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p style={{ fontFamily: 'Source Serif Pro, serif' }}>No notifications yet</p>
          </div>
        ) : (
          <div>
            {/* TODAY Section */}
            {groups.today.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TODAY</h4>
                </div>
                <div className="space-y-2 px-3">
                  {groups.today.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      markAsRead={markAsRead}
                      deleteNotification={deleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* THIS WEEK Section */}
            {groups.thisWeek.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">THIS WEEK</h4>
                </div>
                <div className="space-y-2 px-3">
                  {groups.thisWeek.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      markAsRead={markAsRead}
                      deleteNotification={deleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* LAST WEEK Section */}
            {groups.lastWeek.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">LAST WEEK</h4>
                </div>
                <div className="space-y-2 px-3">
                  {groups.lastWeek.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      markAsRead={markAsRead}
                      deleteNotification={deleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

// Notification Item Component
function NotificationItem({ notification, onNotificationClick, markAsRead, deleteNotification, getNotificationIcon, getTimeAgo }) {
  return (
    <div
      className={`rounded-lg p-2.5 sm:p-3 cursor-pointer transition-all group relative ${
        !notification.isRead 
          ? 'bg-gradient-to-r from-[#4A4A8F]/40 to-[#3D3DD4]/40 hover:from-[#4A4A8F]/50 hover:to-[#3D3DD4]/50 border border-purple-500/30' 
          : 'bg-gray-900/50 hover:bg-gray-900 border border-transparent'
      }`}
      onClick={() => onNotificationClick(notification)}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Icon */}
        <div className="text-xl sm:text-2xl flex-shrink-0 mt-1">
          {getNotificationIcon(notification)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white line-clamp-2 mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {notification.title}
          </h4>
          
          <p className="text-xs text-gray-400 line-clamp-2" style={{ fontFamily: 'Source Serif Pro, serif' }}>
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {getTimeAgo(notification.createdAt)}
            </span>

            {notification.actionButton && (
              <span className="text-xs text-purple-400 flex items-center gap-1">
                {notification.actionButton.text}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Actions - Show on hover */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification._id);
              }}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Mark as read"
            >
              <Check className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification._id);
            }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
