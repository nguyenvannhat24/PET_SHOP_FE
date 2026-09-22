import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import AppointmentModal from '../../components/modals/AppointmentModal';
import { useModal } from '../../context/ModalContext';

const MyAppointments = () => {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [clinics, setClinics] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, CONFIRMED, HISTORY

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptRes, petRes, clinicRes] = await Promise.all([
        apiClient.get('/appointments'),
        apiClient.get('/pets'),
        apiClient.get('/clinics')
      ]);
      setAppointments(apptRes.data.data || []);
      setPets(petRes.data.data || []);
      setClinics(clinicRes.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelAppointment = async (id) => {
    const confirmed = await showConfirm({
      title: 'Hủy lịch hẹn?',
      message: 'Bạn có chắc chắn muốn hủy lịch hẹn khám này không?',
      confirmText: 'Đồng ý hủy',
      cancelText: 'Giữ lại lịch',
      type: 'danger',
      isDanger: true,
    });

    if (confirmed) {
      try {
        await apiClient.patch(`/appointments/${id}/status`, { status: 'CANCELLED' });
        fetchData();
        showAlert({
          title: 'Đã hủy',
          message: 'Lịch hẹn đã được hủy thành công.',
          type: 'info',
        });
      } catch (err) {
        console.error("Lỗi hủy lịch hẹn:", err);
        showAlert({
          title: 'Lỗi',
          message: err.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch.',
          type: 'error',
        });
      }
    }
  };

  // Lọc dữ liệu theo tab
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'HISTORY') {
      return appt.status === 'COMPLETED' || appt.status === 'CANCELLED';
    }
    return appt.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Đang chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã khám xong</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch hẹn của bạn 📅</h1>
          <p className="text-gray-500 mt-2">Quản lý các lịch khám, tiêm phòng và chăm sóc sức khỏe</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
        >
          <span>+</span> Đặt lịch hẹn mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'PENDING' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đang chờ
          {activeTab === 'PENDING' && <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">{filteredAppointments.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'CONFIRMED' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sắp tới (Đã xác nhận)
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'HISTORY' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lịch sử
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center mt-6">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có lịch hẹn nào</h2>
          <p className="text-gray-500">
            {activeTab === 'PENDING' && 'Bạn chưa có lịch hẹn nào đang chờ xác nhận.'}
            {activeTab === 'CONFIRMED' && 'Không có lịch hẹn nào sắp diễn ra.'}
            {activeTab === 'HISTORY' && 'Chưa có lịch sử khám bệnh nào.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {filteredAppointments.map((appt) => (
            <div key={appt._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {appt.start_time?.split(':')[0] || '12'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{formatDate(appt.appointment_date)}</h3>
                    <p className="text-gray-500 font-medium">{appt.start_time} • {appt.clinic_id?.name || 'Phòng khám'}</p>
                  </div>
                </div>
                {getStatusBadge(appt.status)}
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {appt.service_id && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2.5 rounded-lg mb-3 text-xs font-semibold border border-emerald-100">
                    <span className="flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Dịch vụ: <strong>{appt.service_id.name}</strong></span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      {appt.service_id.price ? `${Number(appt.service_id.price).toLocaleString()} đ` : ''}
                    </span>
                  </div>
                )}
                <div className="flex mb-2">
                  <span className="text-gray-500 text-sm w-24">Thú cưng:</span>
                  <span className="font-bold text-gray-900 text-sm">{appt.pet_id?.name || 'Đã xóa'}</span>
                </div>
                <div className="flex mb-2">
                  <span className="text-gray-500 text-sm w-24">Lý do:</span>
                  <span className="font-semibold text-gray-800 text-sm">{appt.reason || 'Không có'}</span>
                </div>
                {(appt.symptoms || appt.notes) && (
                  <div className="flex">
                    <span className="text-gray-500 text-sm w-24">Ghi chú:</span>
                    <span className="text-gray-600 text-sm flex-1">{appt.symptoms ? `${appt.symptoms}. ` : ''}{appt.notes}</span>
                  </div>
                )}
              </div>

              {activeTab === 'PENDING' && (
                <div className="mt-auto flex justify-end border-t border-gray-100 pt-4">
                  <button 
                    onClick={() => handleCancelAppointment(appt._id)}
                    className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                  >
                    Hủy lịch hẹn
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Đặt lịch */}
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        pets={pets}
        clinics={clinics}
        onSave={fetchData}
      />
    </div>
  );
};

export default MyAppointments;
