import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Bell } from 'lucide-react';
import api from '../services/api';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-6 h-6 text-red-500" />;
      case 'comment': return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case 'follow': return <User className="w-6 h-6 text-green-500" />;
      default: return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="pt-20 px-4 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No notifications yet</h3>
          <p className="text-gray-500 mt-2">When someone likes or comments on your posts, you'll see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm ${
                !notification.isRead ? 'border-l-4 border-purple-600' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <img
                src={notification.sender?.avatarUrl || `https://i.pravatar.cc/150?u=${notification.senderId}`}
                alt={notification.sender?.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <p className="text-gray-800">
                  <span className="font-semibold">{notification.sender?.fullName || notification.sender?.username}</span>
                  {' '}{notification.message}
                </p>
                {notification.post && (
                  <p className="text-sm text-gray-500 truncate mt-1">{notification.post.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;