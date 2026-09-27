import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Calendar, Clock, CheckCircle, AlertCircle, 
  User, Plus, ChevronRight, Stethoscope, FileText, Phone, Award
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';
import getImageUrl from '../../utils/imageUrl';

const VeterinarianDashboard = () => {
  const { showAlert, showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    waitingCount: 0,
    totalPatients: 0
  });

  // Modal tạo bệnh án nhanh
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: ''
  });
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptRes, profileRes] = await Promise.all([
        apiClient.get('/appointments'),
        apiClient.get('/veterinarians/me').catch(() => ({ data: { data: null } }))
      ]);

      const apptList = apptRes.data.data || [];
      setAppointments(apptList);
      setDoctorProfile(profileRes.data.data || null);

      // Lọc các ca khám hôm nay
      const todayStr = new Date().toISOString().split('T')[0];
      const todayList = apptList.filter(a => {
        if (!a.appointment_date) return false;
        const apptDateStr = new Date(a.appointment_date).toISOString().split('T')[0];
        return apptDateStr === todayStr;
      });

      setTodayAppointments(todayList);

      const inProgress = todayList.filter(a => a.status === 'IN_PROGRESS').length;
      const completed = todayList.filter(a => a.status === 'COMPLETED').length;
      const waiting = todayList.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length;

      // Đếm số bệnh nhân độc nhất
      const uniquePets = new Set(apptList.map(a => a.pet_id?._id || a.pet_id)).size;

      setStats({
        todayCount: todayList.length,
        inProgressCount: inProgress,
        completedCount: completed,
        waitingCount: waiting,
        totalPatients: uniquePets
      });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu trang bác sĩ:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Bắt đầu khám (Chuyển sang IN_PROGRESS)
  const handleStartExamination = async (appt) => {
    const confirmed = await showConfirm({
      title: 'Bắt đầu khám bệnh',
      message: `Bắt đầu tiếp nhận khám cho bệnh nhân ${appt.pet_id?.name || 'thú cưng'}?`,
      type: 'info',
      confirmText: 'Bắt đầu khám'
    });

    if (confirmed) {
      try {
        await apiClient.patch(`/appointments/${appt._id}/status`, { status: 'IN_PROGRESS' });
        showAlert({
          title: 'Đã bắt đầu khám',
          message: `Ca khám của ${appt.pet_id?.name} đang diễn ra.`,
          type: 'success'
        });
        fetchData();
      } catch (err) {
        showAlert({
          title: 'Lỗi',
          message: err.response?.data?.message || 'Không thể đổi trạng thái ca khám.',
          type: 'error'
        });
      }
    }
  };

  // Mở modal hoàn tất khám & tạo bệnh án
  const handleOpenCompleteModal = (appt) => {
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

  // Lưu hồ sơ bệnh án & đánh dấu ca khám hoàn tất
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
      // 1. Tạo Medical Record
      await apiClient.post('/medical-records', {
        pet_id: selectedAppt.pet_id?._id || selectedAppt.pet_id,
        appointment_id: selectedAppt._id,
        diagnosis: recordForm.diagnosis,
        symptoms: recordForm.symptoms,
        treatment: recordForm.treatment,
        prescription: recordForm.prescription,
        notes: recordForm.notes
      });

      // 2. Chuyển trạng thái lịch hẹn sang COMPLETED
      await apiClient.patch(`/appointments/${selectedAppt._id}/status`, { status: 'COMPLETED' });

      setIsRecordModalOpen(false);
      setSelectedAppt(null);
      showAlert({
        title: 'Hoàn tất ca khám',
        message: `Đã lập hồ sơ bệnh án và hoàn thành lịch khám cho ${selectedAppt.pet_id?.name || 'bé'}!`,
        type: 'success'
      });
      fetchData();
    } catch (err) {
      showAlert({
        title: 'Lỗi lưu bệnh án',
        message: err.response?.data?.message || 'Không thể lưu hồ sơ bệnh án.',
        type: 'error'
      });
    } finally {
      setIsSavingRecord(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const getPetImage = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 animate-pulse">Đang khám</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Chờ vào khám</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Đã hoàn thành</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Chờ duyệt</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Stethoscope size={14} /> Khu vực Bác sĩ Thú y
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Xin chào, BS. {doctorProfile?.name || 'Bác sĩ'} 👋
            </h1>
            <p className="text-teal-100 text-sm md:text-base mt-2 max-w-xl">
              {doctorProfile?.clinic_id 
                ? `Đang công tác tại ${doctorProfile.clinic_id.name}. Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng!`
                : 'Chúc bạn một ngày làm việc hiệu quả và đem lại sức khỏe tốt nhất cho các bé cưng!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/veterinarian/schedule"
              className="bg-white text-teal-800 hover:bg-teal-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Calendar size={16} /> Xem toàn bộ lịch khám
            </Link>
            <Link
              to="/veterinarian/records"
              className="bg-teal-800/40 hover:bg-teal-800/60 border border-white/30 text-white px-4 py-2.5 rounded-xl font-medium text-sm backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <FileText size={16} /> Hồ sơ bệnh án
            </Link>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 -bottom-8 opacity-10 text-9xl select-none pointer-events-none">
          🐾
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Hôm nay</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.todayCount}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng số ca hẹn hôm nay</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Đang khám</p>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.inProgressCount}</p>
          <p className="text-xs text-gray-400 mt-1">Bệnh nhân đang tiếp nhận</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Đã khám xong</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.completedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Ca khám đã hoàn tất hôm nay</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tổng bệnh nhân</p>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-700 mt-2">{stats.totalPatients}</p>
          <p className="text-xs text-gray-400 mt-1">Số thú cưng từng phụ trách</p>
        </div>
      </div>

      {/* Main Grid: Today's Queue & Weekly Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Today's Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>Danh sách ca khám hôm nay</span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">
                    {todayAppointments.length} ca
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Tiếp nhận bệnh nhân theo đúng giờ hẹn</p>
              </div>

              <Link
                to="/veterinarian/schedule"
                className="text-primary hover:text-primary/80 text-xs font-semibold flex items-center gap-1"
              >
                Xem tất cả <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Đang tải lịch khám hôm nay...</div>
            ) : todayAppointments.length === 0 ? (
              <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-semibold text-gray-700">Hôm nay chưa có lịch hẹn nào</p>
                <p className="text-xs text-gray-400 mt-1">Bạn có thể kiểm tra danh sách bệnh nhân hoặc hồ sơ bệnh án cũ.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      appt.status === 'IN_PROGRESS'
                        ? 'border-blue-300 bg-blue-50/40 shadow-sm ring-1 ring-blue-200'
                        : appt.status === 'COMPLETED'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Pet & Owner Details */}
                      <div className="flex items-center gap-4">
                        <img
                          src={getPetImage(appt.pet_id?.image_url)}
                          alt={appt.pet_id?.name || 'Pet'}
                          className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">{appt.pet_id?.name || 'Thú cưng'}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {appt.pet_id?.species || 'Thú cưng'} {appt.pet_id?.breed ? `• ${appt.pet_id.breed}` : ''}
                            </span>
                            {getStatusBadge(appt.status)}
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            Chủ nuôi: <span className="font-medium text-gray-700">{appt.owner_id?.full_name || 'Khách hàng'}</span>
                            {appt.owner_id?.phone && (
                              <span className="ml-2 text-teal-600 inline-flex items-center gap-0.5">
                                <Phone size={10} /> {appt.owner_id.phone}
                              </span>
                            )}
                          </p>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                              <Clock size={12} className="text-primary" /> {appt.start_time}
                            </span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">
                              {appt.service_id?.name || 'Khám tổng quát'}
                            </span>
                          </div>

                          {appt.symptoms && (
                            <p className="text-xs text-amber-700 bg-amber-50/80 px-2 py-1 rounded-lg mt-2 inline-block">
                              ⚠️ Ghi chú: {appt.symptoms}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {appt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStartExamination(appt)}
                            className="bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Stethoscope size={14} /> Bắt đầu khám
                          </button>
                        )}

                        {appt.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleOpenCompleteModal(appt)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle size={14} /> Hoàn tất & Kê đơn
                          </button>
                        )}

                        {appt.status === 'COMPLETED' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle size={14} /> Đã khám xong
                          </span>
                        )}

                        <Link
                          to={`/veterinarian/records?pet_id=${appt.pet_id?._id || appt.pet_id}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                        >
                          Hồ sơ bé
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Doctor Specialty & Weekly Schedule Card */}
        <div className="space-y-6">
          {/* Doctor Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-500 mb-4">
              Thông tin chuyên môn
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Chuyên khoa</span>
                <span className="font-semibold text-gray-900">{doctorProfile?.specialty || 'Đa khoa thú y'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Kinh nghiệm</span>
                <span className="font-semibold text-gray-900">{doctorProfile?.experience_years || 1} năm</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Phí tư vấn khám</span>
                <span className="font-bold text-emerald-600">{formatPrice(doctorProfile?.consultation_fee || 150000)}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-gray-500">Nơi công tác</span>
                <span className="font-semibold text-gray-900 text-right truncate max-w-[150px]">
                  {doctorProfile?.clinic_id?.name || 'Phòng khám thú y'}
                </span>
              </div>
            </div>

            <Link
              to="/veterinarian/profile"
              className="mt-5 w-full block text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Cập nhật hồ sơ & Bảng giá
            </Link>
          </div>

          {/* Weekly Work Slots Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Lịch trực trong tuần</h3>
              <Link to="/veterinarian/profile" className="text-xs text-primary font-semibold hover:underline">
                Chỉnh sửa
              </Link>
            </div>

            <div className="space-y-2">
              {(doctorProfile?.schedules || [
                { day_of_week: 'Thứ 2', start_time: '08:00', end_time: '17:00', is_active: true },
                { day_of_week: 'Thứ 3', start_time: '08:00', end_time: '17:00', is_active: true },
                { day_of_week: 'Thứ 4', start_time: '08:00', end_time: '17:00', is_active: true },
                { day_of_week: 'Thứ 5', start_time: '08:00', end_time: '17:00', is_active: true },
                { day_of_week: 'Thứ 6', start_time: '08:00', end_time: '17:00', is_active: true },
                { day_of_week: 'Thứ 7', start_time: '08:00', end_time: '12:00', is_active: true },
                { day_of_week: 'Chủ nhật', start_time: '08:00', end_time: '12:00', is_active: false }
              ]).map((sch, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">{sch.day_of_week}</span>
                  {sch.is_active ? (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      {sch.start_time} - {sch.end_time}
                    </span>
                  ) : (
                    <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Nghỉ trực</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Hoàn tất khám & Kê đơn thuốc */}
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
                  placeholder="Ví dụ: Viêm da dị ứng, Rối loạn tiêu hóa, Sốt nhẹ..."
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
                  placeholder="Mô tả triệu chứng phát hiện qua thăm khám..."
                  value={recordForm.symptoms}
                  onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phác đồ / Hướng điều trị
                </label>
                <textarea
                  rows={2}
                  placeholder="Phương pháp can thiệp, tiêm thuốc tại chỗ, chế độ ăn..."
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
                  placeholder="Ví dụ: 
- Amoxicillin 250mg: 1 viên/ngày x 5 ngày
- Men vi sinh Probiotics: 1 gói/ngày pha nước"
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Lời dặn & Hẹn tái khám
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tái khám sau 5 ngày nếu không giảm sốt..."
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
                  {isSavingRecord ? 'Đang lưu...' : 'Lưu bệnh án & Hoàn thành'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianDashboard;
