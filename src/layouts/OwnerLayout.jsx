import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, Calendar, FileText, User, LogOut, Activity, MessageSquare } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';
import getImageUrl from '../utils/imageUrl';

const OwnerLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const getAvatarSrc = (avatar_url) => {
    return getImageUrl(avatar_url, 'https://via.placeholder.com/150?text=Avatar');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <Link to="/" className="h-16 flex items-center px-6 border-b border-gray-100 text-primary font-bold text-xl hover:opacity-80 transition-opacity">
          🐾 PET CONNECT
        </Link>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <NavLink to="/owner/dashboard" end className={navLinkClass}>
            <Home size={20} /> Tổng quan
          </NavLink>
          <NavLink to="/owner/pets" className={navLinkClass}>
            <User size={20} /> Thú cưng
          </NavLink>
          <NavLink to="/owner/records" className={navLinkClass}>
            <Activity size={20} /> Sổ bệnh án
          </NavLink>
          <NavLink to="/owner/appointments" className={navLinkClass}>
            <Calendar size={20} /> Lịch hẹn
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            <MessageSquare size={20} /> Tin nhắn
          </NavLink>
          <NavLink to="/owner/profile" className={navLinkClass}>
            <FileText size={20} /> Hồ sơ
          </NavLink>
          
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
            >
              <LogOut size={20} /> Đăng xuất
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10">
          <div className="font-semibold text-lg"></div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <img
              src={getAvatarSrc(user?.avatar_url)}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 bg-gray-50"
            />
            <span className="font-medium text-gray-700">{user?.full_name || 'Khách'}</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
