import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Activity, Calendar, User, FileText, Settings, LogOut, Stethoscope, ChevronRight, MessageSquare } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';
import getImageUrl from '../utils/imageUrl';

const VeterinarianLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const getAvatarSrc = (avatar_url) => {
    return getImageUrl(avatar_url, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
      isActive
        ? 'bg-primary text-white shadow-sm shadow-primary/30 font-semibold'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-100 flex flex-col z-20">
        <Link to="/" className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 text-primary font-bold text-lg hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">
            🩺
          </div>
          <span>BÁC SĨ THÚ Y</span>
        </Link>

        {/* Doctor quick card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
          <img
            src={getAvatarSrc(user?.avatar_url)}
            alt="Doctor"
            className="w-11 h-11 rounded-full object-cover border border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user?.full_name ? `BS. ${user.full_name}` : 'Bác sĩ Thú y'}
            </p>
            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
              ● Đang hoạt động
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1.5 overflow-y-auto">
          <NavLink to="/veterinarian/dashboard" end className={navLinkClass}>
            <Activity size={20} />
            <span>Tổng quan</span>
          </NavLink>

          <NavLink to="/veterinarian/schedule" className={navLinkClass}>
            <Calendar size={20} />
            <span>Lịch khám</span>
          </NavLink>

          <NavLink to="/veterinarian/patients" className={navLinkClass}>
            <User size={20} />
            <span>Bệnh nhân</span>
          </NavLink>

          <NavLink to="/veterinarian/records" className={navLinkClass}>
            <FileText size={20} />
            <span>Hồ sơ bệnh án</span>
          </NavLink>

          <NavLink to="/chat" className={navLinkClass}>
            <MessageSquare size={20} />
            <span>Tin nhắn</span>
          </NavLink>

          <NavLink to="/veterinarian/profile" className={navLinkClass}>
            <Settings size={20} />
            <span>Hồ sơ & Ca trực</span>
          </NavLink>

          {/* Logout button */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
            >
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <Stethoscope className="text-primary" size={20} /> Cổng thông tin Bác sĩ điều trị
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link
              to="/veterinarian/profile"
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-full border border-gray-100 transition-colors"
            >
              <img
                src={getAvatarSrc(user?.avatar_url)}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-gray-800 leading-tight">
                  {user?.full_name || 'Bác sĩ'}
                </p>
                <p className="text-[10px] text-gray-400">Chuyên khoa thú y</p>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VeterinarianLayout;
