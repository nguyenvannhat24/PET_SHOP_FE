import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Clock, User, Building, 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Scissors
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const AdminAppointments = () => {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedDate) params.append('date', selectedDate);

      const res = await apiClient.get(`/admin/appointments?${params.toString()}`);
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch hẹn hệ thống:', err);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải danh sách lịch hẹn.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedStatus, selectedDate]);

  const handleChangeStatus = async (appt, newStatus) => {
    if (appt.status === newStatus) return;

    const confirmed = await showConfirm({
      title: 'Can thiệp trạng thái lịch hẹn?',
      message: `Bạn có chắc muốn chuyển trạng thái lịch hẹn của bé "${appt.pet_id?.name || 'thú cưng'}" sang "${newStatus}"?`,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      type: newStatus === 'CANCELLED' ? 'danger' : 'warning'
    });

    if (!confirmed) return;

    try {
      await apiClient.patch(`/admin/appointments/${appt._id}/status`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a._id === appt._id ? { ...a, status: newStatus } : a))
      );
      showAlert({
        title: 'Thành công',
        message: 'Trạng thái lịch hẹn đã được cập nhật.',
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể cập nhật trạng thái.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Đã xong</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">Đã duyệt</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">Đang khám</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Chờ duyệt</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-orange-500" size={24} />
            <span>Giám sát Lịch hẹn Toàn hệ thống</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi mọi ca khám và dịch vụ đặt trước trên nền tảng, can thiệp trạng thái khi cần giải quyết tranh chấp
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">⏳ Chờ duyệt</option>
            <option value="CONFIRMED">✅ Đã xác nhận</option>
            <option value="IN_PROGRESS">🩺 Đang khám</option>
            <option value="COMPLETED">✨ Đã hoàn thành</option>
            <option value="CANCELLED">❌ Đã hủy</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Lọc theo ngày:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-[11px] text-orange-600 font-bold hover:underline"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      {/* Table of Appointments */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500">Đang tải danh sách lịch hẹn...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-5xl">📅</div>
            <h3 className="font-bold text-gray-800 text-base">Không có lịch hẹn nào</h3>
            <p className="text-xs text-gray-400">Không tìm thấy ca khám nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-400 uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Thú cưng & Chủ</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Phòng khám & Bác sĩ</th>
                  <th className="py-3.5 px-4">Gói Dịch vụ</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-6 text-right">Can thiệp Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Pet & Owner */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 text-sm">🐾 {a.pet_id?.name || 'Thú cưng'}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        Chủ: <span className="font-semibold text-gray-700">{a.owner_id?.full_name || 'Khách'}</span> ({a.owner_id?.phone || 'N/A'})
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="font-bold text-gray-900">{formatDate(a.appointment_date)}</div>
                      <div className="text-gray-500 text-[11px] flex items-center gap-1">
                        <Clock size={11} className="text-gray-400" />
                        <span>{a.start_time}</span>
                      </div>
                    </td>

                    {/* Clinic & Vet */}
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        <Building size={12} className="text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[160px]">{a.clinic_id?.name || 'N/A'}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {a.veterinarian_id?.name ? `BS. ${a.veterinarian_id.name}` : <span className="italic text-gray-400">Chưa chỉ định bác sĩ</span>}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-4 px-4">
                      {a.service_id ? (
                        <div>
                          <div className="font-bold text-emerald-800 flex items-center gap-1">
                            <Scissors size={12} className="text-emerald-600" />
                            <span>{a.service_id.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {a.service_id.price ? `${Number(a.service_id.price).toLocaleString()} đ` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Khám & Tư vấn chung</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {getStatusBadge(a.status)}
                    </td>

                    {/* Admin Override */}
                    <td className="py-4 px-6 text-right">
                      <select
                        value={a.status}
                        onChange={(e) => handleChangeStatus(a, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="CONFIRMED">Đã duyệt</option>
                        <option value="IN_PROGRESS">Đang khám</option>
                        <option value="COMPLETED">Đã hoàn tất</option>
                        <option value="CANCELLED">Hủy lịch</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
