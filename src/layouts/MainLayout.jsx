import React from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const MainLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

  const getDashboardPath = () => {
    if (!user) return '/auth/login';
    if (user.role === 'CLINIC') return '/clinic/dashboard';
    if (user.role === 'VETERINARIAN') return '/veterinarian/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/owner/dashboard';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <span>🐾</span> PET CONNECT
        </Link>
        <nav className="flex gap-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `font-bold tracking-wider uppercase text-sm transition-colors duration-200 py-5 border-b-4 ${isActive ? 'text-primary border-primary' : 'text-gray-600 border-transparent hover:text-primary'}`
            }
          >
            Trang chủ
          </NavLink>
          <NavLink 
            to="/clinics" 
            className={({ isActive }) => 
              `font-bold tracking-wider uppercase text-sm transition-colors duration-200 py-5 border-b-4 ${isActive ? 'text-primary border-primary' : 'text-gray-600 border-transparent hover:text-primary'}`
            }
          >
            Phòng khám & Bác sĩ
          </NavLink>
          <NavLink 
            to="/services" 
            className={({ isActive }) => 
              `font-bold tracking-wider uppercase text-sm transition-colors duration-200 py-5 border-b-4 ${isActive ? 'text-primary border-primary' : 'text-gray-600 border-transparent hover:text-primary'}`
            }
          >
            Dịch vụ thú cưng
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Chat Quick Link */}
              <Link
                to="/chat"
                className="p-2.5 rounded-2xl text-gray-600 hover:text-primary hover:bg-gray-100 transition-all"
                title="Trò chuyện trực tuyến"
              >
                <MessageSquare size={20} />
              </Link>

              <Link 
                to={getDashboardPath()} 
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-sm ml-1"
              >
                <span>👤</span> {user.full_name || 'Bảng điều khiển'}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/auth/login" className="px-4 py-2 text-primary font-bold text-sm hover:underline">
                Đăng nhập
              </Link>
              <Link to="/auth/register" className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow hover:bg-opacity-90 transition-all">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className={`flex-1 bg-background ${isChatPage ? 'h-[calc(100vh-4rem)] overflow-hidden flex flex-col' : ''}`}>
        <Outlet />
      </main>
      {!isChatPage && (
        <footer className="bg-gray-800 text-white p-8 text-center mt-auto">
          &copy; {new Date().getFullYear()} Pet Connect. All rights reserved.
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
