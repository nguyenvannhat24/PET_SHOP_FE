import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Activity, Users, Building, Calendar, Settings, 
  LogOut, ShieldAlert, Home, ExternalLink, Sparkles, MessageSquare 
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';

const AdminLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const getAvatarSrc = (avatar_url) => {
    if (!avatar_url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    if (avatar_url.startsWith('http')) return avatar_url;
    let path = avatar_url.replace(/\\/g, '/');
    if (!path.startsWith('/')) path = '/' + path;
    return `http://localhost:5000${path}`;
  };

  const navLinkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs tracking-wide transition-all ${
      isActive 
        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-gray-800 shrink-0">
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800/80 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/30">
            👑
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider uppercase text-white">
              System Admin
            </h1>
            <p className="text-[10px] text-amber-400 font-semibold tracking-wide">
              PET CONNECT HQ
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">
            Quản trị hệ thống
          </div>

          <NavLink to="/admin/dashboard" end className={navLinkClass}>
            <Activity size={18} />
            <span>Tổng quan (Dashboard)</span>
          </NavLink>

          <NavLink to="/admin/users" className={navLinkClass}>
            <Users size={18} />
            <span>Quản lý Người dùng</span>
          </NavLink>

          <NavLink to="/admin/clinics" className={navLinkClass}>
            <Building size={18} />
            <span>Quản lý Phòng khám</span>
          </NavLink>

          <NavLink to="/admin/appointments" className={navLinkClass}>
            <Calendar size={18} />
            <span>Giám sát Lịch hẹn</span>
          </NavLink>

          <NavLink to="/chat" className={navLinkClass}>
            <MessageSquare size={18} />
            <span>Trung tâm Tin nhắn</span>
          </NavLink>

          <div className="text-[10px] font-bold text-gray-500 uppercase px-4 mt-6 mb-2 tracking-wider">
            Cấu hình
          </div>

          <NavLink to="/admin/settings" className={navLinkClass}>
            <Settings size={18} />
            <span>Cài đặt nền tảng</span>
          </NavLink>

          {/* Quick link to main site */}
          <Link 
            to="/" 
            target="_blank"
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold text-gray-400 hover:text-emerald-400 hover:bg-gray-900 transition-all mt-2 border border-gray-800/60"
          >
            <span className="flex items-center gap-2.5">
              <Home size={16} />
              <span>Xem trang người dùng</span>
            </span>
            <ExternalLink size={13} />
          </Link>

          {/* Logout */}
          <div className="mt-auto pt-4 border-t border-gray-800/80">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span>Đăng xuất hệ thống</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200/80 shadow-xs flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hệ thống máy chủ hoạt động bình thường</span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-xs font-extrabold text-gray-900 leading-none">
                {user?.full_name || 'System Admin'}
              </p>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 mt-1 inline-block">
                Super Admin
              </span>
            </div>
            <img 
              src={getAvatarSrc(user?.avatar_url)} 
              alt="Avatar" 
              className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-gray-200 bg-gray-50" 
            />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
