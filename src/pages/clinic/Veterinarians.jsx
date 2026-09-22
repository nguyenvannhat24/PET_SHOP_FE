import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const ALL_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const ClinicVeterinarians = () => {
  const { showAlert, showConfirm } = useModal();
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal Thêm Bác sĩ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Filter & Search in current clinic's doctor list
  const [filterKeyword, setFilterKeyword] = useState('');
  // Modal Cấu hình Lịch & Thông tin Bác sĩ
  const [editingVet, setEditingVet] = useState(null);
  const [vetFormData, setVetFormData] = useState({
    specialty: '',
    experience_years: 1,
    consultation_fee: 150000,
    schedules: []
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/veterinarians');
      setVeterinarians(response.data.data || []);
      setError(null);
    } catch (err) {
      console.warn("API chưa sẵn sàng hoặc lỗi:", err);
      setVeterinarians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered list based on filterKeyword
  const filteredVets = veterinarians.filter((vet) => {
    if (!filterKeyword.trim()) return true;
    const kw = filterKeyword.toLowerCase();
    const name = (vet.name || (vet.user_id && vet.user_id.full_name) || '').toLowerCase();
    const specialty = (vet.specialty || '').toLowerCase();
    const email = (vet.email || (vet.user_id && vet.user_id.email) || '').toLowerCase();
    const phone = (vet.phone || (vet.user_id && vet.user_id.phone) || '').toLowerCase();
    return name.includes(kw) || specialty.includes(kw) || email.includes(kw) || phone.includes(kw);
  });

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchEmail.trim().length > 2) {
        setIsSearching(true);
        try {
          const res = await apiClient.get(`/users/search-vets?q=${searchEmail}`);
          setSuggestions(res.data.data || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Lỗi tìm kiếm:", err);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchEmail]);

  const handleSelectSuggestion = (vet) => {
    setSearchEmail(vet.email);
    setShowSuggestions(false);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    try {
      await apiClient.post('/veterinarians', { email: searchEmail });
      setIsModalOpen(false);
      setSearchEmail('');
      fetchData();
      showAlert({
        title: 'Thành công',
        message: 'Đã thêm bác sĩ vào phòng khám thành công!',
        type: 'success',
      });
    } catch (err) {
      console.error("Lỗi chi tiết:", err);
      showAlert({
        title: 'Thất bại',
        message: err.response?.data?.message || err.message || 'Lỗi thêm bác sĩ. Hãy kiểm tra lại email hoặc mở Shop trước.',
        type: 'error',
      });
    }
  };

  const confirmRemoveDoctor = async (vet) => {
    const docName = vet.name || (vet.user_id && vet.user_id.full_name) || 'này';
    const confirmed = await showConfirm({
      title: 'Gỡ liên kết bác sĩ?',
      message: `Bạn có chắc chắn muốn gỡ bác sĩ ${docName} khỏi Shop không? Hồ sơ cá nhân của bác sĩ vẫn sẽ được bảo lưu.`,
      confirmText: 'Đồng ý gỡ',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      await apiClient.delete(`/veterinarians/${vet._id}`);
      fetchData();
      showAlert({
        title: 'Thành công',
        message: 'Đã gỡ bác sĩ khỏi phòng khám thành công!',
        type: 'success',
      });
    } catch (err) {
      console.error("Lỗi khi gỡ bác sĩ:", err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || err.message || 'Lỗi khi gỡ bác sĩ khỏi phòng khám.',
        type: 'error',
      });
    }
  };

  // Mở modal cấu hình lịch của bác sĩ
  const handleOpenScheduleModal = (vet) => {
    setEditingVet(vet);

    // Chuẩn hóa schedules cho đủ các ngày trong tuần
    const existingMap = {};
    if (vet.schedules && vet.schedules.length > 0) {
      vet.schedules.forEach(s => {
        existingMap[s.day_of_week] = s;
      });
    }

    const fullSchedules = ALL_DAYS.map(day => {
      if (existingMap[day]) {
        return {
          day_of_week: day,
          start_time: existingMap[day].start_time || '08:00',
          end_time: existingMap[day].end_time || '17:00',
          is_active: existingMap[day].is_active !== undefined ? existingMap[day].is_active : true,
          note: existingMap[day].note || ''
        };
      }
      return {
        day_of_week: day,
        start_time: '08:00',
        end_time: '17:00',
        is_active: day !== 'Chủ nhật',
        note: ''
      };
    });

    setVetFormData({
      specialty: vet.specialty || 'Đa khoa thú y',
      experience_years: vet.experience_years !== undefined ? vet.experience_years : 1,
      consultation_fee: vet.consultation_fee || 150000,
      schedules: fullSchedules
    });
  };

  const handleScheduleDayChange = (index, field, value) => {
    setVetFormData(prev => {
      const updated = [...prev.schedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedules: updated };
    });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!editingVet) return;
    setIsSavingSchedule(true);
    try {
      await apiClient.put(`/veterinarians/${editingVet._id}/schedule`, vetFormData);
      showAlert({
        title: 'Thành công',
        message: 'Cập nhật lịch làm việc và thông tin bác sĩ thành công!',
        type: 'success',
      });
      setEditingVet(null);
      fetchData();
    } catch (err) {
      console.error("Lỗi cập nhật lịch bác sĩ:", err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch.',
        type: 'error',
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đội ngũ Bác sĩ & Lịch trực 👨‍⚕️</h1>
          <p className="text-gray-500 mt-2">Quản lý bác sĩ công tác tại Shop và thiết lập ca trực hàng tuần của từng bác sĩ</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span>+</span> Thêm Bác sĩ vào Shop
        </button>
      </div>

      {/* Thống kê & Thanh tìm kiếm nhanh */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Tổng số bác sĩ trong Shop:</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm">
            {veterinarians.length} bác sĩ
          </span>
        </div>
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên, chuyên khoa, email..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredVets.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm mt-2">
          <div className="text-5xl mb-3">👨‍⚕️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {veterinarians.length === 0 ? "Shop chưa có bác sĩ nào" : "Không tìm thấy bác sĩ phù hợp"}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {veterinarians.length === 0 
              ? "Hãy bấm 'Thêm Bác sĩ vào Shop' để mời các bác sĩ đã có tài khoản trên hệ thống tham gia vào đội ngũ phòng khám của bạn." 
              : "Thử tìm kiếm với từ khóa khác."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets.map((vet) => {
            const activeDays = (vet.schedules || []).filter(s => s.is_active);
            return (
              <div key={vet._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/30">
                <div>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-3">
                      <img
                        src={vet.avatar_url || (vet.user_id && vet.user_id.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || (vet.user_id && vet.user_id.full_name) || 'Doctor')}&background=random`}
                        alt={vet.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                      />
                      <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Đang công tác"></span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl">{vet.name || (vet.user_id && vet.user_id.full_name) || 'Bác sĩ'}</h3>
                    <p className="text-primary font-semibold text-sm">{vet.specialty || 'Đa khoa thú y'}</p>
                  </div>

                  <div className="w-full bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 space-y-2 mb-4">
                    <p><strong>Kinh nghiệm:</strong> {vet.experience_years ? `${vet.experience_years} năm` : 'Chưa cập nhật'}</p>
                    <p><strong>SĐT:</strong> {vet.phone || (vet.user_id && vet.user_id.phone) || 'Chưa cập nhật'}</p>
                    <p><strong>Email:</strong> {vet.email || (vet.user_id && vet.user_id.email) || 'Chưa cập nhật'}</p>
                    <p><strong>Phí khám:</strong> <span className="text-emerald-700 font-bold">{vet.consultation_fee ? `${vet.consultation_fee.toLocaleString()} VNĐ` : '150,000 VNĐ'}</span></p>
                  </div>

                  {/* Lịch làm việc tóm tắt */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span>📅</span> Lịch trực tuần:
                    </p>
                    {activeDays.length === 0 ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">Chưa thiết lập ca trực</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeDays.map(s => (
                          <span key={s.day_of_week} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium" title={`${s.start_time} - ${s.end_time}`}>
                            {s.day_of_week}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-4 border-t border-gray-100 flex gap-2">
                  <button 
                    onClick={() => handleOpenScheduleModal(vet)}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <span>⚙️</span> Cấu hình Lịch
                  </button>
                  <button 
                    onClick={() => confirmRemoveDoctor(vet)}
                    className="py-2.5 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center"
                    title="Gỡ khỏi shop"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cấu hình Lịch & Thông tin Bác sĩ */}
      {editingVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cấu hình Lịch & Thông tin Bác sĩ
                </h2>
                <p className="text-xs text-gray-500">
                  {editingVet.name || (editingVet.user_id && editingVet.user_id.full_name)} ({editingVet.email || (editingVet.user_id && editingVet.user_id.email)})
                </p>
              </div>
              <button onClick={() => setEditingVet(null)} className="text-gray-400 hover:text-red-500 font-bold text-2xl">×</button>
            </div>

            <form onSubmit={handleSaveSchedule} className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Thông tin chuyên môn */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chuyên khoa</label>
                  <input
                    type="text"
                    value={vetFormData.specialty}
                    onChange={(e) => setVetFormData({ ...vetFormData, specialty: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="VD: Da liễu, Ngoại khoa..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kinh nghiệm (năm)</label>
                  <input
                    type="number"
                    min="0"
                    value={vetFormData.experience_years}
                    onChange={(e) => setVetFormData({ ...vetFormData, experience_years: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phí khám (VNĐ)</label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={vetFormData.consultation_fee}
                    onChange={(e) => setVetFormData({ ...vetFormData, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Bảng Lịch làm việc các ngày trong tuần */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📅</span> Ca trực / Lịch làm việc trong tuần của Bác sĩ:
                </h3>
                <div className="space-y-2 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  {vetFormData.schedules.map((schedule, idx) => (
                    <div key={schedule.day_of_week} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-xl border transition-all ${schedule.is_active ? 'bg-white border-gray-200' : 'bg-gray-100/60 border-transparent opacity-60'}`}>
                      <div className="flex items-center gap-3 w-32">
                        <input
                          type="checkbox"
                          id={`day-${idx}`}
                          checked={schedule.is_active}
                          onChange={(e) => handleScheduleDayChange(idx, 'is_active', e.target.checked)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <label htmlFor={`day-${idx}`} className="text-sm font-bold text-gray-800 cursor-pointer">
                          {schedule.day_of_week}
                        </label>
                      </div>

                      {schedule.is_active ? (
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-1 justify-end">
                          <span className="text-xs text-gray-500">Từ</span>
                          <input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) => handleScheduleDayChange(idx, 'start_time', e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white"
                          />
                          <span className="text-xs text-gray-500">Đến</span>
                          <input
                            type="time"
                            value={schedule.end_time}
                            onChange={(e) => handleScheduleDayChange(idx, 'end_time', e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Ghi chú ca (tùy chọn)"
                            value={schedule.note || ''}
                            onChange={(e) => handleScheduleDayChange(idx, 'note', e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white w-28 hidden md:block"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Nghỉ</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVet(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-opacity-90 text-sm shadow transition-all flex items-center gap-2"
                >
                  {isSavingSchedule ? 'Đang lưu...' : 'Lưu Cấu Hình Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Bác sĩ (Tìm kiếm bằng Email) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" ref={wrapperRef}>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Thêm Bác sĩ vào Shop</h2>
              <button onClick={() => {setIsModalOpen(false); setSearchEmail(''); setSuggestions([]);}} className="text-gray-400 hover:text-red-500 font-bold text-2xl">×</button>
            </div>

            <div className="p-6 relative">
              <p className="text-sm text-gray-500 mb-4">
                Nhập địa chỉ Email của tài khoản Bác sĩ thú y để liên kết vào Shop của bạn. Bác sĩ cần đăng ký tài khoản trên hệ thống trước.
              </p>
              <form id="vetSearchForm" onSubmit={handleAddDoctor}>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Bác sĩ *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={searchEmail} 
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="ví dụ: doctor@petcare.com"
                    autoComplete="off"
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                  />
                  
                  {isSearching && (
                    <div className="absolute right-3 top-9">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Dropdown Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((vet) => (
                        <li 
                          key={vet._id} 
                          onClick={() => handleSelectSuggestion(vet)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <img 
                            src={vet.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.full_name || vet.email)}&background=random`} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-sm text-gray-900">{vet.full_name || 'Chưa cập nhật tên'}</p>
                            <p className="text-xs text-gray-500">{vet.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => {setIsModalOpen(false); setSearchEmail('');}} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-200 bg-white">Hủy</button>
              <button type="submit" form="vetSearchForm" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary shadow hover:bg-opacity-90">Thêm vào Shop</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicVeterinarians;
