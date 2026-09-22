import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Building, Calendar, Activity, Sparkles, 
  ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2, 
  Clock, XCircle, RefreshCw, Scissors
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">👑 Admin</span>;
      case 'CLINIC':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">🏥 Phòng khám</span>;
      case 'VETERINARIAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">👨‍⚕️ Bác sĩ</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">🐾 Chủ thú cưng</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Đã xong</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">Đã duyệt</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">Đang khám</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Chờ duyệt</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-semibold">Đang tổng hợp dữ liệu hệ thống...</p>
      </div>
    );
  }

  const ov = stats?.overview || {};
  const ub = stats?.usersBreakdown || {};
  const ab = stats?.appointmentsBreakdown || {};
  const recentUsers = stats?.recentUsers || [];
  const recentAppointments = stats?.recentAppointments || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-gray-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
            <Sparkles size={13} />
            <span>Trung tâm Điều hành Nền tảng Pet Connect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Bảng Điều Khiển Hệ Thống 👑
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
            Giám sát thời gian thực người dùng, các cơ sở phòng khám, dịch vụ thú y và toàn bộ lịch hẹn trên nền tảng.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/10 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Users Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng người dùng</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-3">{ov.totalUsers || 0}</div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between">
            <span>Chủ nuôi: <strong>{ub.owners || 0}</strong></span>
            <span>Bác sĩ: <strong>{ub.vets || 0}</strong></span>
            <span>Phòng khám: <strong>{ub.clinics || 0}</strong></span>
          </div>
        </div>

        {/* Clinics Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phòng khám / Shop</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-3">{ov.totalClinics || 0}</div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between">
            <span>Dịch vụ niêm yết: <strong>{ov.totalServices || 0}</strong></span>
            <Link to="/admin/clinics" className="text-emerald-600 font-bold hover:underline">Quản lý →</Link>
          </div>
        </div>

        {/* Pets Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hồ sơ thú cưng</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              🐾
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 mt-3">{ov.totalPets || 0}</div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
            Đã đăng ký hồ sơ y tế & sổ tiêm
          </div>
        </div>

        {/* Appointments Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng lịch hẹn</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-3">{ov.totalAppointments || 0}</div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
            <span className="text-amber-600 font-bold">Chờ duyệt: {ab.pending || 0}</span>
            <Link to="/admin/appointments" className="text-orange-600 font-bold hover:underline">Chi tiết →</Link>
          </div>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Users size={16} className="text-primary" /> Phân bố Tài khoản theo Vai trò
          </h3>
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">🐾 Chủ thú cưng (Pet Owner)</span>
                <span className="text-gray-900 font-bold">{ub.owners || 0}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${ov.totalUsers ? ((ub.owners || 0) / ov.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">🏥 Cơ sở Thú y (Clinic / Shop)</span>
                <span className="text-gray-900 font-bold">{ub.clinics || 0}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${ov.totalUsers ? ((ub.clinics || 0) / ov.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">👨‍⚕️ Bác sĩ Thú y (Veterinarian)</span>
                <span className="text-gray-900 font-bold">{ub.vets || 0}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${ov.totalUsers ? ((ub.vets || 0) / ov.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-gray-600">👑 Quản trị viên (Admin)</span>
                <span className="text-gray-900 font-bold">{ub.admins || 0}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${ov.totalUsers ? ((ub.admins || 0) / ov.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" /> Tình trạng Lịch hẹn toàn sàn
            </h3>
            <Link to="/admin/appointments" className="text-xs font-bold text-orange-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 text-center">
              <Clock className="text-amber-600 mx-auto mb-1" size={20} />
              <p className="text-[11px] text-gray-500 font-semibold">Chờ duyệt</p>
              <p className="text-xl font-extrabold text-amber-700 mt-1">{ab.pending || 0}</p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-center">
              <CheckCircle2 className="text-blue-600 mx-auto mb-1" size={20} />
              <p className="text-[11px] text-gray-500 font-semibold">Đã xác nhận</p>
              <p className="text-xl font-extrabold text-blue-700 mt-1">{ab.confirmed || 0}</p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
              <Sparkles className="text-emerald-600 mx-auto mb-1" size={20} />
              <p className="text-[11px] text-gray-500 font-semibold">Đã hoàn thành</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">{ab.completed || 0}</p>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 text-center">
              <XCircle className="text-rose-600 mx-auto mb-1" size={20} />
              <p className="text-[11px] text-gray-500 font-semibold">Đã hủy</p>
              <p className="text-xl font-extrabold text-rose-700 mt-1">{ab.cancelled || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Tables Row: Recent Users & Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Thành viên mới đăng ký</h3>
            <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">
              Quản lý thành viên →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                  <th className="pb-3">Họ tên & Email</th>
                  <th className="pb-3">Vai trò</th>
                  <th className="pb-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/60">
                    <td className="py-3">
                      <div className="font-bold text-gray-900">{u.full_name}</div>
                      <div className="text-gray-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3">{getRoleBadge(u.role)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Lịch hẹn mới nhất</h3>
            <Link to="/admin/appointments" className="text-xs font-bold text-orange-600 hover:underline">
              Giám sát toàn bộ →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                  <th className="pb-3">Thú cưng & Chủ</th>
                  <th className="pb-3">Phòng khám</th>
                  <th className="pb-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentAppointments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/60">
                    <td className="py-3">
                      <div className="font-bold text-gray-900">🐾 {a.pet_id?.name || 'Thú cưng'}</div>
                      <div className="text-gray-400 text-[11px]">{a.owner_id?.full_name || 'Khách'}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-gray-800 font-medium truncate max-w-[140px]">{a.clinic_id?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-[10px]">{a.start_time}</div>
                    </td>
                    <td className="py-3 text-right">{getStatusBadge(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
