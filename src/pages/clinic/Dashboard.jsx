import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const ClinicDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [vetsCount, setVetsCount] = useState(0);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, vetRes, clinicRes] = await Promise.all([
          apiClient.get('/appointments'),
          apiClient.get('/veterinarians'),
          apiClient.get('/clinics/my-clinic')
        ]);
        setAppointments(apptRes.data.data || []);
        setVetsCount((vetRes.data.data || []).length);
        setClinicInfo(clinicRes.data.data || null);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingAppointments = appointments.filter(a => a.status === 'PENDING').length;
  const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED').length;
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {clinicInfo?.name ? `${clinicInfo.name} 🏥` : 'Tổng quan Phòng khám 🏥'}
          </h1>
          <p className="text-gray-500 mt-2">
            {clinicInfo?.address ? `📍 ${clinicInfo.address} • Giờ mở cửa: ${clinicInfo.opening_time || '08:00'} - ${clinicInfo.closing_time || '20:00'}` : 'Quản lý lịch hẹn, đội ngũ bác sĩ và hoạt động của shop'}
          </p>
        </div>
        {!clinicInfo && (
          <Link
            to="/clinic/profile"
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow hover:bg-opacity-90"
          >
            + Mở Shop / Phòng khám ngay
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl">⏳</div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Lịch chờ duyệt</p>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : pendingAppointments}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">📅</div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Lịch sắp tới</p>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : confirmedAppointments}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">👨‍⚕️</div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Bác sĩ công tác</p>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : vetsCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl">✅</div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Đã khám xong</p>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : completedAppointments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lịch chờ duyệt gần đây */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Yêu cầu đặt lịch mới</h2>
            <Link to="/clinic/appointments" className="text-primary font-bold hover:underline text-sm">Xem tất cả ➔</Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : pendingAppointments === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có yêu cầu đặt lịch nào đang chờ.</div>
          ) : (
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'PENDING').slice(0, 4).map(appt => (
                <div key={appt._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-900">{appt.pet_id?.name || 'Thú cưng'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(appt.appointment_date).toLocaleDateString('vi-VN')} • {appt.start_time} • Bác sĩ: {appt.veterinarian_id?.name || 'Chưa chỉ định'}
                    </p>
                  </div>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Chờ duyệt</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lối tắt quản trị nhanh */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quản lý Hoạt động Shop</h2>
            <div className="space-y-4">
              <Link
                to="/clinic/profile"
                className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏥</span>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Cấu hình Shop & Lịch hoạt động</h4>
                    <p className="text-xs text-gray-500">Giờ mở cửa, ngày làm việc trong tuần, logo, địa chỉ</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                to="/clinic/veterinarians"
                className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👨‍⚕️</span>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Phân ca & Quản lý Bác sĩ</h4>
                    <p className="text-xs text-gray-500">Thêm bác sĩ, điều chỉnh ca trực tuần và biểu phí khám</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                to="/clinic/appointments"
                className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Duyệt & Xử lý Lịch hẹn</h4>
                    <p className="text-xs text-gray-500">Xem lịch theo bác sĩ, chấp thuận và hoàn thành khám</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
