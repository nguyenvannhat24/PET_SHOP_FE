import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Search, Filter, Stethoscope, CheckCircle, 
  XCircle, AlertCircle, Phone, User, FileText, ChevronRight, Syringe
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';
import getImageUrl from '../../utils/imageUrl';

const VeterinarianSchedule = () => {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, TODAY, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Modal lập bệnh án
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: ''
  });
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Modal xem chi tiết ca hẹn
  const [viewingAppt, setViewingAppt] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = '/appointments';
      const params = [];
      if (selectedDate) params.push(`date=${selectedDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await apiClient.get(url);
      setAppointments(res.data.data || []);
    } catch (error) {
      console.error('Lỗi khi tải lịch khám:', error);
      showAlert({
        title: 'Lỗi tải dữ liệu',
        message: 'Không thể tải danh sách lịch khám. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  // Đổi trạng thái lịch hẹn
  const handleUpdateStatus = async (appt, newStatus) => {
    const statusMap = {
      IN_PROGRESS: 'Bắt đầu khám',
      COMPLETED: 'Hoàn tất ca khám',
      CANCELLED: 'Hủy ca khám'
    };

    const isDanger = newStatus === 'CANCELLED';
    const confirmed = await showConfirm({
      title: `${statusMap[newStatus]}`,
      message: `Bạn có chắc chắn muốn ${statusMap[newStatus].toLowerCase()} cho ${appt.pet_id?.name || 'thú cưng'}?`,
      type: isDanger ? 'danger' : 'info',
      confirmText: statusMap[newStatus],
      isDanger
    });

    if (confirmed) {
      try {
        await apiClient.patch(`/appointments/${appt._id}/status`, { status: newStatus });
        showAlert({
          title: 'Thành công',
          message: `Đã cập nhật trạng thái ca khám thành công.`,
          type: 'success'
        });
        fetchAppointments();
      } catch (err) {
        showAlert({
          title: 'Lỗi',
          message: err.response?.data?.message || 'Không thể cập nhật trạng thái.',
          type: 'error'
        });
      }
    }
  };

  // Mở modal tạo bệnh án
  const handleOpenCreateRecord = (appt) => {
    setSelectedAppt(appt);
    setRecordForm({
      diagnosis: '',
      symptoms: appt.symptoms || appt.reason || '',
      treatment: '',
      prescription: '',
      notes: ''
    });
    setIsRecordModalOpen(true);
  };

  // Submit bệnh án & chuyển sang COMPLETED
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.diagnosis.trim()) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập chẩn đoán bệnh cho thú cưng.',
        type: 'warning'
      });
      return;
    }

    setIsSavingRecord(true);
    try {
      await apiClient.post('/medical-records', {
        pet_id: selectedAppt.pet_id?._id || selectedAppt.pet_id,
        appointment_id: selectedAppt._id,
        diagnosis: recordForm.diagnosis,
        symptoms: recordForm.symptoms,
        treatment: recordForm.treatment,
        prescription: recordForm.prescription,
        notes: recordForm.notes
      });

      // Chuyển lịch sang COMPLETED
      await apiClient.patch(`/appointments/${selectedAppt._id}/status`, { status: 'COMPLETED' });

      setIsRecordModalOpen(false);
      setSelectedAppt(null);
      showAlert({
        title: 'Thành công',
        message: `Đã lưu hồ sơ bệnh án và hoàn thành ca khám!`,
        type: 'success'
      });
      fetchAppointments();
    } catch (err) {
      showAlert({
        title: 'Lỗi lưu bệnh án',
        message: err.response?.data?.message || 'Không thể lưu bệnh án.',
        type: 'error'
      });
    } finally {
      setIsSavingRecord(false);
    }
  };

  const getPetImage = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-300 animate-pulse">Đang khám</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">Chờ vào khám</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300">Hoàn thành</span>;
      case 'PENDING':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">Chờ duyệt</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Lọc theo Tab và Keyword
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((appt) => {
    // Lọc theo tab
    if (activeTab === 'TODAY') {
      const apptDateStr = appt.appointment_date ? new Date(appt.appointment_date).toISOString().split('T')[0] : '';
      if (apptDateStr !== todayStr) return false;
    } else if (activeTab === 'CONFIRMED') {
      if (appt.status !== 'CONFIRMED') return false;
    } else if (activeTab === 'IN_PROGRESS') {
      if (appt.status !== 'IN_PROGRESS') return false;
    } else if (activeTab === 'COMPLETED') {
      if (appt.status !== 'COMPLETED') return false;
    } else if (activeTab === 'CANCELLED') {
      if (appt.status !== 'CANCELLED' && appt.status !== 'REJECTED') return false;
    }

    // Lọc theo keyword
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const petName = (appt.pet_id?.name || '').toLowerCase();
      const breed = (appt.pet_id?.breed || '').toLowerCase();
      const ownerName = (appt.owner_id?.full_name || '').toLowerCase();
      const ownerPhone = (appt.owner_id?.phone || '').toLowerCase();
      return petName.includes(kw) || breed.includes(kw) || ownerName.includes(kw) || ownerPhone.includes(kw);
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>Quản lý Lịch khám bệnh</span> 🩺
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi, tiếp nhận bệnh nhân và quản lý tiến trình ca khám
          </p>
        </div>

        {/* Date Filter & Clear */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-gray-700 bg-transparent focus:outline-none"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-gray-500 hover:text-red-500 font-medium px-2 py-1 bg-gray-100 rounded-lg transition-colors"
            >
              Xem tất cả ngày
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'TODAY', label: 'Hôm nay' },
            { id: 'CONFIRMED', label: 'Chờ khám' },
            { id: 'IN_PROGRESS', label: 'Đang khám' },
            { id: 'COMPLETED', label: 'Đã hoàn thành' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên bé, chủ nuôi, SĐT..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Đang tải danh sách lịch khám...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-gray-800 text-base">Không tìm thấy ca khám nào</h3>
          <p className="text-gray-400 text-xs mt-1">Vui lòng thử chọn tab khác hoặc thay đổi bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAppointments.map((appt) => (
            <div
              key={appt._id}
              className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md ${
                appt.status === 'IN_PROGRESS'
                  ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/10'
                  : appt.status === 'COMPLETED'
                  ? 'border-emerald-100'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Pet & Owner Details */}
                <div className="flex items-start sm:items-center gap-4">
                  <img
                    src={getPetImage(appt.pet_id?.image_url)}
                    alt={appt.pet_id?.name || 'Pet'}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{appt.pet_id?.name || 'Bé cưng'}</h3>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {appt.pet_id?.species || 'Thú cưng'} {appt.pet_id?.breed ? `• ${appt.pet_id.breed}` : ''}
                      </span>
                      {appt.pet_id?.weight && (
                        <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                          {appt.pet_id.weight} kg
                        </span>
                      )}
                      {getStatusBadge(appt.status)}
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-gray-400" />
                        Chủ: <span className="font-semibold text-gray-800">{appt.owner_id?.full_name || 'Khách'}</span>
                      </span>
                      {appt.owner_id?.phone && (
                        <a
                          href={`tel:${appt.owner_id.phone}`}
                          className="flex items-center gap-1 text-teal-600 hover:underline font-medium"
                        >
                          <Phone size={12} /> {appt.owner_id.phone}
                        </a>
                      )}
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600 font-medium">
                        Dịch vụ: {appt.service_id?.name || 'Khám chữa bệnh'}
                      </span>
                    </div>

                    {appt.symptoms && (
                      <p className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg mt-1.5 inline-block">
                        ⚠️ Triệu chứng khách ghi: <span className="font-medium">{appt.symptoms}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Time, Date & Actions */}
                <div className="flex flex-wrap items-center lg:flex-col lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  <div className="text-left lg:text-right">
                    <div className="flex items-center lg:justify-end gap-1.5 font-bold text-gray-900 text-sm">
                      <Clock size={14} className="text-primary" /> {appt.start_time}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{formatDate(appt.appointment_date)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {appt.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appt, 'IN_PROGRESS')}
                          className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                        >
                          <Stethoscope size={13} /> Bắt đầu khám
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt, 'CANCELLED')}
                          className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleOpenCreateRecord(appt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle size={13} /> Hoàn tất & Kê đơn
                      </button>
                    )}

                    <button
                      onClick={() => setViewingAppt(appt)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Xem chi tiết ca hẹn */}
      {viewingAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Chi tiết lịch hẹn khám 📋</h3>
              <button
                onClick={() => setViewingAppt(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <img
                  src={getPetImage(viewingAppt.pet_id?.image_url)}
                  alt="Pet"
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{viewingAppt.pet_id?.name}</h4>
                  <p className="text-xs text-gray-500">
                    {viewingAppt.pet_id?.species} • {viewingAppt.pet_id?.breed || 'Chưa rõ giống'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {viewingAppt.pet_id?.age ? `${viewingAppt.pet_id.age} tuổi` : ''} 
                    {viewingAppt.pet_id?.gender ? ` • Giới tính: ${viewingAppt.pet_id.gender}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Thời gian khám</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {viewingAppt.start_time} - {formatDate(viewingAppt.appointment_date)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Trạng thái</p>
                  <div className="mt-1">{getStatusBadge(viewingAppt.status)}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin chủ nuôi</p>
                <p className="font-bold text-gray-900">{viewingAppt.owner_id?.full_name}</p>
                <p className="text-xs text-gray-600">SĐT: {viewingAppt.owner_id?.phone || 'Chưa cập nhật'}</p>
                <p className="text-xs text-gray-600">Email: {viewingAppt.owner_id?.email || 'Chưa cập nhật'}</p>
              </div>

              {viewingAppt.symptoms && (
                <div className="bg-amber-50/70 border border-amber-100 p-3.5 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Triệu chứng & Lý do khám</p>
                  <p className="text-xs text-amber-900 mt-1">{viewingAppt.symptoms}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingAppt(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lập bệnh án & Hoàn thành */}
      {isRecordModalOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Hoàn tất khám & Lập bệnh án 🩺</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Bệnh nhân: <span className="font-bold text-gray-800">{selectedAppt.pet_id?.name}</span> • Chủ nuôi: {selectedAppt.owner_id?.full_name}
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRecord} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Chẩn đoán bệnh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Viêm da dị ứng, Sốt siêu vi, Rối loạn tiêu hóa..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Triệu chứng lâm sàng
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả triệu chứng phát hiện khi thăm khám..."
                  value={recordForm.symptoms}
                  onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phác đồ điều trị
                </label>
                <textarea
                  rows={2}
                  placeholder="Phương pháp điều trị, chỉ định kiêng khem..."
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Đơn thuốc & Liều dùng
                </label>
                <textarea
                  rows={3}
                  placeholder="Liệt kê tên thuốc, số lượng, liều dùng..."
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ghi chú & Lời dặn
                </label>
                <input
                  type="text"
                  placeholder="Lời dặn cho chủ nuôi, lịch tái khám..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecord}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSavingRecord ? 'Đang lưu...' : 'Lưu bệnh án & Hoàn tất'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianSchedule;
