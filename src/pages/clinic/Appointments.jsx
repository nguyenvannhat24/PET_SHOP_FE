import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const ClinicAppointments = () => {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, CONFIRMED, HISTORY

  // Modal gán bác sĩ nhanh
  const [assigningAppt, setAssigningAppt] = useState(null);
  const [tempVetId, setTempVetId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/appointments';
      if (selectedVetId) {
        url += `?veterinarian_id=${selectedVetId}`;
      }
      const [apptRes, vetRes] = await Promise.all([
        apiClient.get(url),
        apiClient.get('/veterinarians')
      ]);
      setAppointments(apptRes.data.data || []);
      setVeterinarians(vetRes.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải lịch hẹn:", err);
      setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedVetId]);

  // Cập nhật trạng thái lịch hẹn (kèm kiểm tra trùng lịch nếu CONFIRMED)
  const handleUpdateStatus = async (appt, newStatus) => {
    setConflictWarning(null);

    // Nếu duyệt lịch mà chưa có bác sĩ
    if (newStatus === 'CONFIRMED' && !appt.veterinarian_id?._id && !appt.veterinarian_id) {
      setAssigningAppt(appt);
      setTempVetId(veterinarians.length > 0 ? veterinarians[0]._id : '');
      return;
    }

    const statusMap = {
      CONFIRMED: 'Duyệt',
      CANCELLED: 'Từ chối / Hủy',
      COMPLETED: 'Hoàn thành'
    };

    const isDanger = newStatus === 'CANCELLED';
    const confirmed = await showConfirm({
      title: `${statusMap[newStatus]} lịch hẹn`,
      message: `Bạn có chắc chắn muốn ${statusMap[newStatus].toLowerCase()} lịch hẹn này của khách hàng ${appt.owner_id?.full_name || ''}?`,
      type: isDanger ? 'danger' : 'info',
      confirmText: statusMap[newStatus],
      isDanger
    });
    
    if (confirmed) {
      try {
        await apiClient.patch(`/appointments/${appt._id}/status`, { 
          status: newStatus,
          veterinarian_id: appt.veterinarian_id?._id || appt.veterinarian_id
        });
        fetchData();
        showAlert({
          title: 'Thành công',
          message: `Đã ${statusMap[newStatus].toLowerCase()} lịch hẹn thành công!`,
          type: 'success'
        });
      } catch (err) {
        console.error("Lỗi cập nhật lịch hẹn:", err);
        const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
        setConflictWarning(errorMsg);
        showAlert({
          title: 'Thông báo lỗi',
          message: errorMsg,
          type: 'error'
        });
      }
    }
  };

  // Chỉ định bác sĩ và duyệt luôn nếu đang trong luồng duyệt
  const handleConfirmAssignVet = async (e) => {
    e.preventDefault();
    if (!assigningAppt || !tempVetId) return;

    try {
      // Gọi duyệt kèm bác sĩ đã chọn
      await apiClient.patch(`/appointments/${assigningAppt._id}/status`, {
        status: 'CONFIRMED',
        veterinarian_id: tempVetId
      });
      setAssigningAppt(null);
      setConflictWarning(null);
      fetchData();
      showAlert({
        title: 'Thành công',
        message: 'Đã chỉ định bác sĩ và duyệt lịch hẹn thành công!',
        type: 'success'
      });
    } catch (err) {
      console.error("Lỗi chỉ định bác sĩ:", err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi chỉ định bác sĩ.';
      setConflictWarning(errorMsg);
      showAlert({
        title: 'Trùng lịch / Lỗi duyệt',
        message: errorMsg,
        type: 'error'
      });
    }
  };

  // Đổi bác sĩ phụ trách cho lịch hẹn
  const handleChangeDoctor = async (apptId, newVetId) => {
    try {
      await apiClient.patch(`/appointments/${apptId}/assign-vet`, { veterinarian_id: newVetId });
      fetchData();
      showAlert({
        title: 'Thành công',
        message: 'Đã thay đổi bác sĩ phụ trách cho lịch hẹn này!',
        type: 'success'
      });
    } catch (err) {
      console.error("Lỗi đổi bác sĩ:", err);
      showAlert({
        title: 'Không thể đổi bác sĩ',
        message: err.response?.data?.message || 'Lỗi khi đổi bác sĩ.',
        type: 'error'
      });
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
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Chờ duyệt</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã hoàn thành</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Lịch hẹn & Chỉ định Bác sĩ 📅</h1>
          <p className="text-gray-500 mt-2">Theo dõi, chỉ định bác sĩ phụ trách và kiểm tra tránh trùng lịch khám</p>
        </div>

        {/* Bộ lọc theo Bác sĩ */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <label className="text-xs font-bold text-gray-600 whitespace-nowrap">👨‍⚕️ Xem theo Bác sĩ:</label>
          <select
            value={selectedVetId}
            onChange={(e) => setSelectedVetId(e.target.value)}
            className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Tất cả bác sĩ ({veterinarians.length}) --</option>
            {veterinarians.map(vet => (
              <option key={vet._id} value={vet._id}>
                {vet.name || (vet.user_id && vet.user_id.full_name) || 'Bác sĩ'} ({vet.specialty || 'Đa khoa'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {conflictWarning && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 p-4 rounded-2xl mb-6 font-semibold flex items-start gap-3 shadow-sm animate-in fade-in">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold text-rose-900">Cảnh báo Trùng lịch Khám!</h4>
            <p className="text-sm mt-1">{conflictWarning}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'PENDING' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Yêu cầu mới (Chờ duyệt)
          {activeTab === 'PENDING' && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{filteredAppointments.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'CONFIRMED' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lịch đã duyệt (Sắp tới)
          {activeTab === 'CONFIRMED' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filteredAppointments.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'HISTORY' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lịch sử khám
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
            {activeTab === 'PENDING' && 'Chưa có yêu cầu đặt lịch mới nào.'}
            {activeTab === 'CONFIRMED' && 'Không có lịch hẹn nào sắp diễn ra.'}
            {activeTab === 'HISTORY' && 'Chưa có lịch sử khám bệnh nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const currentVetId = appt.veterinarian_id?._id || appt.veterinarian_id;
            return (
              <div key={appt._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary flex-shrink-0">
                    <span className="text-xs font-bold uppercase">{new Date(appt.appointment_date).toLocaleDateString('vi-VN', { month: 'short' })}</span>
                    <span className="text-xl font-black">{new Date(appt.appointment_date).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{appt.pet_id?.name || 'Thú cưng'}</h3>
                      {appt.pet_id?.species && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-lg font-medium">
                          {appt.pet_id.species}
                        </span>
                      )}
                      {getStatusBadge(appt.status)}
                    </div>
                    {appt.service_id && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 mb-2">
                        <span>✨ Dịch vụ: {appt.service_id.name}</span>
                        {appt.service_id.price && (
                          <span className="text-emerald-700">({Number(appt.service_id.price).toLocaleString()} đ)</span>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-y-1 gap-x-4">
                      <span>🕒 <strong>{appt.start_time}</strong> ngày {new Date(appt.appointment_date).toLocaleDateString('vi-VN')}</span>
                      <span>👤 Chủ: <strong>{appt.owner_id?.full_name || 'Khách'}</strong> ({appt.owner_id?.phone || 'N/A'})</span>
                    </div>

                    {/* Hàng chọn / chỉ định bác sĩ */}
                    <div className="my-2 p-3 bg-gray-50 rounded-2xl flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-gray-700">👨‍⚕️ Bác sĩ phụ trách:</span>
                      {activeTab === 'HISTORY' ? (
                        <span className="text-xs font-bold text-gray-900">
                          {appt.veterinarian_id?.name || 'Không có'}
                        </span>
                      ) : (
                        <select
                          value={currentVetId || ''}
                          onChange={(e) => handleChangeDoctor(appt._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary ${
                            currentVetId ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          <option value="">-- Chưa chỉ định (Chọn bác sĩ) --</option>
                          {veterinarians.map(vet => (
                            <option key={vet._id} value={vet._id}>
                              👨‍⚕️ {vet.name || (vet.user_id && vet.user_id.full_name)} ({vet.specialty || 'Đa khoa'})
                            </option>
                          ))}
                        </select>
                      )}
                      {!currentVetId && activeTab === 'PENDING' && (
                        <span className="text-[11px] text-amber-600 font-semibold italic">
                          * Cần chọn bác sĩ trước khi duyệt
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50/70 p-3 rounded-xl text-xs text-gray-700">
                      <span className="font-semibold">Lý do khám:</span> {appt.reason || 'Khám tổng quát'} 
                      {appt.symptoms && <><br/><span className="font-semibold">Triệu chứng:</span> {appt.symptoms}</>}
                      {appt.notes && <><br/><span className="font-semibold text-gray-500">Ghi chú:</span> {appt.notes}</>}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 flex-col sm:flex-row">
                  {activeTab === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(appt, 'CANCELLED')}
                        className="px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Từ chối
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt, 'CONFIRMED')}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-opacity-90 transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>✓</span> Duyệt lịch
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'CONFIRMED' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(appt, 'CANCELLED')}
                        className="px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Hủy lịch
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt, 'COMPLETED')}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                      >
                        ✓ Hoàn thành khám
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chọn Bác Sĩ khi bấm Duyệt mà chưa có bác sĩ */}
      {assigningAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chỉ định Bác sĩ phụ trách 👨‍⚕️</h3>
            <p className="text-sm text-gray-500 mb-4">
              Lịch hẹn của khách <strong>{assigningAppt.owner_id?.full_name}</strong> ({assigningAppt.start_time}, {new Date(assigningAppt.appointment_date).toLocaleDateString('vi-VN')}) chưa có bác sĩ phụ trách. Vui lòng chọn bác sĩ để duyệt:
            </p>

            <form onSubmit={handleConfirmAssignVet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Chọn Bác sĩ trong Shop *</label>
                <select
                  value={tempVetId}
                  onChange={(e) => setTempVetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                >
                  <option value="" disabled>-- Chọn bác sĩ --</option>
                  {veterinarians.map(vet => (
                    <option key={vet._id} value={vet._id}>
                      👨‍⚕️ {vet.name || (vet.user_id && vet.user_id.full_name)} ({vet.specialty || 'Đa khoa'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningAppt(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-opacity-90 shadow transition-colors"
                >
                  Xác nhận & Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicAppointments;
