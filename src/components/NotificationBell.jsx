import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Calendar, MessageSquare, Stethoscope, 
  AlertCircle, CheckCheck, Sparkles, ExternalLink 
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { getSocket } from '../services/socketClient';

const NotificationBell = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Âm thanh thông báo nhẹ nhàng qua Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Trình duyệt có thể chặn autoplay âm thanh khi chưa tương tác
    }
  };

  // 1. Tải danh sách thông báo và số lượng chưa đọc ban đầu
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        apiClient.get('/notifications?limit=20'),
        apiClient.get('/notifications/unread-count')
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.warn('Không thể tải thông báo:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const myUserId = user?._id || user?.id;

  // 2. Lắng nghe thông báo realtime từ Socket.IO
  useEffect(() => {
    if (!myUserId) return;

    const socket = getSocket(myUserId);

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      // Hiển thị Popup Toast nổi ở góc màn hình ngay lập tức
      setToastNotification(newNotif);
      playNotificationSound();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [myUserId]);

  // Tự động tắt Toast Notification sau 6 giây
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // 3. Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  // Đánh dấu 1 thông báo và chuyển hướng
  const handleClickNotification = async (notif) => {
    if (!notif.is_read) {
      try {
        await apiClient.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Lỗi mark read:', err);
      }
    }

    setIsOpen(false);

    // Điều hướng theo loại thông báo
    if (notif.type?.startsWith('APPOINTMENT_')) {
      if (user?.role === 'CLINIC') {
        navigate('/clinic/appointments');
      } else if (user?.role === 'VETERINARIAN') {
        navigate('/veterinarian/schedule');
      } else if (user?.role === 'ADMIN') {
        navigate('/admin/appointments');
      } else {
        navigate('/owner/appointments');
      }
    } else if (notif.type === 'NEW_MESSAGE') {
      if (notif.reference_id) {
        navigate(`/chat?conversationId=${notif.reference_id}`);
      } else {
        navigate('/chat');
      }
    } else if (notif.type?.startsWith('MEDICAL_RECORD_')) {
      navigate('/owner/records');
    }
  };

  const getNotificationIcon = (type) => {
    if (type?.startsWith('APPOINTMENT_')) {
      return <Calendar size={16} className="text-orange-500" />;
    }
    if (type === 'NEW_MESSAGE') {
      return <MessageSquare size={16} className="text-blue-500" />;
    }
    if (type?.startsWith('MEDICAL_RECORD_')) {
      return <Stethoscope size={16} className="text-emerald-500" />;
    }
    return <Sparkles size={16} className="text-amber-500" />;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl text-gray-600 hover:text-primary hover:bg-gray-100 transition-all cursor-pointer focus:outline-none"
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-gray-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="text-4xl">🔔</div>
                <p className="text-xs font-bold text-gray-700">Chưa có thông báo nào</p>
                <p className="text-[11px] text-gray-400">
                  Các cập nhật về lịch hẹn và tin nhắn sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClickNotification(notif)}
                    className={`p-4 flex items-start gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      isUnread ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <div className="p-2.5 rounded-2xl bg-slate-100 shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs truncate ${isUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {notif.content}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 font-medium">
              Hệ thống thông báo đẩy thời gian thực Pet Connect
            </span>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Alert Banner */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 max-w-sm w-[90vw] sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/80 p-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start gap-3.5 ring-1 ring-black/5">
          <div className="p-3 bg-primary/10 rounded-2xl shrink-0 text-primary mt-0.5">
            {getNotificationIcon(toastNotification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-900 truncate">
                {toastNotification.title || 'Thông báo mới'}
              </h4>
              <button 
                onClick={() => setToastNotification(null)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1 -mr-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              {toastNotification.content}
            </p>

            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const target = toastNotification;
                  setToastNotification(null);
                  handleClickNotification(target);
                }}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Xem ngay</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
