import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';
import { Sparkles, Clock, Tag } from 'lucide-react';

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  pets, 
  clinics, 
  onSave, 
  preSelectedClinicId = '', 
  preSelectedServiceId = '' 
}) => {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    pet_id: '',
    clinic_id: '',
    service_id: '',
    veterinarian_id: '',
    appointment_date: '',
    start_time: '',
    reason: '',
    symptoms: '',
    notes: ''
  });

  const [availableVets, setAvailableVets] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingVets, setLoadingVets] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialClinicId = preSelectedClinicId || (clinics.length > 0 ? clinics[0]._id : '');
      const defaultPetId = pets.length > 0 ? pets[0]._id : '';
      setFormData({
        pet_id: defaultPetId,
        clinic_id: initialClinicId,
        service_id: preSelectedServiceId || '',
        veterinarian_id: '',
        appointment_date: '',
        start_time: '',
        reason: '',
        symptoms: '',
        notes: ''
      });
      setError('');
    }
  }, [isOpen, pets, clinics, preSelectedClinicId, preSelectedServiceId]);

  // Cập nhật selectedClinic, tải bác sĩ VÀ tải danh sách dịch vụ của phòng khám
  useEffect(() => {
    if (formData.clinic_id) {
      const c = clinics.find(cl => cl._id === formData.clinic_id);
      setSelectedClinic(c || null);

      // Tải bác sĩ
      const fetchClinicVets = async () => {
        setLoadingVets(true);
        try {
          const res = await apiClient.get(`/veterinarians?clinic_id=${formData.clinic_id}`);
          const vets = res.data.data || [];
          setAvailableVets(vets);
          if (vets.length > 0) {
            setFormData(prev => ({ ...prev, veterinarian_id: prev.veterinarian_id || vets[0]._id }));
            setSelectedVet(vets[0]);
          } else {
            setFormData(prev => ({ ...prev, veterinarian_id: '' }));
            setSelectedVet(null);
          }
        } catch (err) {
          console.warn("Không thể tải bác sĩ của phòng khám:", err);
          setAvailableVets([]);
          setSelectedVet(null);
        } finally {
          setLoadingVets(false);
        }
      };

      // Tải dịch vụ của phòng khám
      const fetchClinicServices = async () => {
        setLoadingServices(true);
        try {
          const res = await apiClient.get(`/services/clinic/${formData.clinic_id}`);
          const services = res.data.data || [];
          setAvailableServices(services);
          
          // Nếu có preSelectedServiceId thì chọn nó
          if (preSelectedServiceId) {
            const found = services.find(s => s._id === preSelectedServiceId);
            if (found) {
              setSelectedService(found);
              setFormData(prev => ({ 
                ...prev, 
                service_id: found._id,
                reason: prev.reason || `Sử dụng dịch vụ: ${found.name}`
              }));
            }
          }
        } catch (err) {
          console.warn("Không thể tải dịch vụ của phòng khám:", err);
          setAvailableServices([]);
          setSelectedService(null);
        } finally {
          setLoadingServices(false);
        }
      };

      fetchClinicVets();
      fetchClinicServices();
    } else {
      setSelectedClinic(null);
      setAvailableVets([]);
      setSelectedVet(null);
      setAvailableServices([]);
      setSelectedService(null);
    }
  }, [formData.clinic_id, clinics, preSelectedServiceId]);

  // Cập nhật selectedVet khi formData.veterinarian_id thay đổi
  useEffect(() => {
    if (formData.veterinarian_id) {
      const v = availableVets.find(item => item._id === formData.veterinarian_id);
      setSelectedVet(v || null);
    } else {
      setSelectedVet(null);
    }
  }, [formData.veterinarian_id, availableVets]);

  // Cập nhật selectedService khi formData.service_id thay đổi
  useEffect(() => {
    if (formData.service_id) {
      const s = availableServices.find(item => item._id === formData.service_id);
      setSelectedService(s || null);
      if (s && !formData.reason) {
        setFormData(prev => ({ ...prev, reason: `Dịch vụ: ${s.name}` }));
      }
    } else {
      setSelectedService(null);
    }
  }, [formData.service_id, availableServices]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getDayOfWeekString = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return DAY_NAMES[d.getDay()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData };
      if (!payload.service_id) delete payload.service_id;
      if (!payload.veterinarian_id) delete payload.veterinarian_id;

      await apiClient.post('/appointments', payload);
      if (onSave) onSave();
      onClose();
      showAlert({
        title: 'Đặt lịch thành công! 🎉',
        message: 'Lịch hẹn của bạn đã được gửi. Phòng khám sẽ sớm xem xét và xác nhận lịch hẹn của bạn.',
        type: 'success',
      });
    } catch (err) {
      console.error("Lỗi đặt lịch hẹn:", err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDayName = getDayOfWeekString(formData.appointment_date);
  const vetWorksOnSelectedDay = selectedVet?.schedules?.find(s => s.day_of_week === selectedDayName && s.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đặt lịch chăm sóc thú cưng 🐾</h2>
            <p className="text-xs text-gray-500 mt-0.5">Chọn dịch vụ, bác sĩ và thời gian thuận tiện nhất</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="overflow-y-auto flex-1 p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {pets.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🐶</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Bạn chưa thêm thú cưng nào</h3>
              <p className="text-gray-500 mb-4 text-sm">Vui lòng thêm hồ sơ thú cưng trước khi tiến hành đặt lịch khám.</p>
              <button onClick={onClose} className="text-primary font-bold hover:underline">Đóng lại</button>
            </div>
          ) : (
            <form id="appointmentForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Chọn Thú cưng */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Chọn Thú cưng *</label>
                  <select name="pet_id" value={formData.pet_id} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-medium">
                    <option value="" disabled>-- Chọn bé cưng --</option>
                    {pets.map(pet => (
                      <option key={pet._id} value={pet._id}>🐾 {pet.name} ({pet.species || 'Thú cưng'})</option>
                    ))}
                  </select>
                </div>
                
                {/* Chọn Phòng khám / Shop */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng khám / Shop *</label>
                  <select name="clinic_id" value={formData.clinic_id} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-medium">
                    <option value="" disabled>-- Chọn phòng khám --</option>
                    {clinics.map(clinic => (
                      <option key={clinic._id} value={clinic._id}>🏥 {clinic.name}</option>
                    ))}
                  </select>
                  {selectedClinic && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      🕒 Giờ mở cửa: {selectedClinic.opening_time || '08:00'} - {selectedClinic.closing_time || '20:00'}
                    </p>
                  )}
                </div>

                {/* Chọn Gói Dịch vụ thực hiện */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Gói Dịch vụ thực hiện {loadingServices && <span className="text-xs text-primary font-normal">(Đang tải...)</span>}</span>
                    {selectedService && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <Tag size={12} /> {selectedService.price?.toLocaleString()}đ
                      </span>
                    )}
                  </label>
                  <select 
                    name="service_id" 
                    value={formData.service_id} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-medium text-sm">
                    <option value="">-- Khám & Tư vấn chung (Không chọn gói dịch vụ cụ thể) --</option>
                    {availableServices.map(srv => (
                      <option key={srv._id} value={srv._id}>
                        ✨ {srv.name} — {srv.price?.toLocaleString()}đ {srv.duration_minutes ? `(~${srv.duration_minutes} phút)` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Card chi tiết dịch vụ đã chọn */}
                  {selectedService && (
                    <div className="mt-2.5 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">✨</span>
                          <span className="font-bold text-gray-900 text-sm">{selectedService.name}</span>
                          {selectedService.species && (
                            <span className="text-[10px] bg-white text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                              {selectedService.species === 'DOG' ? '🐶 Cho Chó' : selectedService.species === 'CAT' ? '🐱 Cho Mèo' : '🐾 Mọi thú cưng'}
                            </span>
                          )}
                        </div>
                        {selectedService.description && (
                          <p className="text-xs text-gray-600 line-clamp-1">{selectedService.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-emerald-700">
                          {selectedService.price?.toLocaleString()}đ
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center justify-end gap-1">
                          <Clock size={11} /> {selectedService.duration_minutes || 45} phút
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chọn Bác sĩ phụ trách thuộc Shop */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bác sĩ phụ trách tại Shop {loadingVets && <span className="text-xs text-primary font-normal">(Đang tải danh sách bác sĩ...)</span>}
                  </label>
                  <select 
                    name="veterinarian_id" 
                    value={formData.veterinarian_id} 
                    onChange={handleChange}
                    disabled={loadingVets || availableVets.length === 0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white font-medium disabled:bg-gray-50 disabled:text-gray-400">
                    {loadingVets ? (
                      <option value="">Đang tải danh sách bác sĩ...</option>
                    ) : availableVets.length === 0 ? (
                      <option value="">Phòng khám chưa có bác sĩ trực</option>
                    ) : (
                      <>
                        <option value="">-- Để phòng khám tự sắp xếp bác sĩ phù hợp --</option>
                        {availableVets.map(vet => (
                          <option key={vet._id} value={vet._id}>
                            👨‍⚕️ {vet.name || (vet.user_id && vet.user_id.full_name) || 'Bác sĩ'} - {vet.specialty || 'Đa khoa thú y'} {vet.consultation_fee ? `(Phí khám: ${vet.consultation_fee.toLocaleString()}đ)` : ''}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {/* Chi tiết lịch làm việc của Bác sĩ được chọn */}
                  {selectedVet && (
                    <div className="mt-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-gray-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-blue-900">
                          👨‍⚕️ {selectedVet.name || (selectedVet.user_id && selectedVet.user_id.full_name)}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          Phí khám: {selectedVet.consultation_fee ? `${selectedVet.consultation_fee.toLocaleString()} VNĐ` : '150,000 VNĐ'}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <strong>Ca trực tuần: </strong>
                        {selectedVet.schedules && selectedVet.schedules.filter(s => s.is_active).length > 0 ? (
                          <span>
                            {selectedVet.schedules.filter(s => s.is_active).map(s => `${s.day_of_week} (${s.start_time}-${s.end_time})`).join(', ')}
                          </span>
                        ) : (
                          <span className="italic">Thứ 2 - Thứ 7 (Giờ hành chính)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Ngày hẹn */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày hẹn *</label>
                  <input 
                    type="date" 
                    name="appointment_date" 
                    value={formData.appointment_date} 
                    onChange={handleChange} 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium" 
                  />
                  {formData.appointment_date && (
                    <div className="mt-1 text-xs">
                      <span className="font-semibold text-gray-700">Ngày chọn: {selectedDayName}. </span>
                      {selectedVet?.schedules && selectedVet.schedules.length > 0 ? (
                        vetWorksOnSelectedDay ? (
                          <span className="text-emerald-600 font-semibold">✓ Bác sĩ có lịch trực ({vetWorksOnSelectedDay.start_time} - {vetWorksOnSelectedDay.end_time})</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">⚠️ Bác sĩ thường nghỉ vào {selectedDayName}, bạn vẫn có thể đặt để phòng khám sắp xếp.</span>
                        )
                      ) : null}
                    </div>
                  )}
                </div>
                
                {/* Giờ hẹn */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ khám *</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    value={formData.start_time} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lý do / Yêu cầu chăm sóc</label>
                  <input type="text" name="reason" value={formData.reason} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Cắt tỉa tạo kiểu lông, Tắm sấy spa, Khám định kỳ..." />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Triệu chứng của bé (nếu đi khám bệnh)</label>
                  <input type="text" name="symptoms" value={formData.symptoms} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Biếng ăn, ho nhẹ, ngứa da..." />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú thêm cho phòng khám</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Lưu ý đặc biệt về tính cách (nhát người, hiếu động), dị ứng xà phòng hoặc thuốc..."></textarea>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-sm">
            Hủy
          </button>
          <button type="submit" form="appointmentForm" disabled={loading || pets.length === 0}
            className={`px-7 py-2.5 rounded-xl font-bold text-white bg-primary shadow transition-all text-sm ${
              (loading || pets.length === 0) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90 hover:shadow-lg'
            }`}>
            {loading ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
