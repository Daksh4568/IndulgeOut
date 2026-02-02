import { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NavigationBar from '../components/NavigationBar';
import Footer from '../components/Footer';
import { Bell, Filter, Trash2, Check, CheckCheck, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    archiveNotification 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, action_required, status_update, reminder, milestone
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const options = { page };
    if (filter === 'unread') {
      options.unreadOnly = true;
    } else if (filter !== 'all') {
      options.category = filter;
    }
    fetchNotifications(options);
  }, [filter, page]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.actionButton?.link) {
      navigate(notification.actionButton.link);
    }
  };

  const getNotificationIcon = (notification) => {
    const emoji = notification.metadata?.emoji;
    if (emoji) return emoji;
    
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

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'action_required', label: 'Action Required' },
    { value: 'status_update', label: 'Updates' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'milestone', label: 'Milestones' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-5xl mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 dark:text-gray-400 mt-2" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                  You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="h-5 w-5" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-gradient-to-b from-[#7878E9] to-[#3D3DD4] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {filter === 'all' ? "You're all caught up!" : `No ${filter.replace('_', ' ')} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-5 border transition-all hover:shadow-md cursor-pointer ${
                  !notification.isRead 
                    ? 'border-blue-300 dark:border-blue-600 shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span className="capitalize">{notification.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{getTimeAgo(notification.createdAt)}</span>
                          {notification.priority !== 'medium' && (
                            <>
                              <span>•</span>
                              <span className={`capitalize ${
                                notification.priority === 'urgent' ? 'text-red-500 font-semibold' :
                                notification.priority === 'high' ? 'text-orange-500' : ''
                              }`}>
                                {notification.priority}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      {notification.message}
                    </p>

                    {notification.actionButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-[#7878E9] to-[#3D3DD4] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                      >
                        {notification.actionButton.text}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(notification._id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
