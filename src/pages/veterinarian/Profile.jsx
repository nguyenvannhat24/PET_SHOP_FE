import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Building2, Award, 
  Calendar, Clock, ShieldCheck, FileText, Save, CheckCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const ALL_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const VeterinarianProfile = () => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    email: '',
    avatar_url: '',
    specialty: 'Đa khoa thú y',
    experience_years: 1,
    consultation_fee: 150000,
    license_number: '',
    education: '',
    bio: '',
    schedules: [],
    clinic: null
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/veterinarians/me');
      const data = res.data.data;
      if (data) {
        // Chuẩn hóa schedules
        let existingSchedules = data.schedules || [];
        const fullSchedules = ALL_DAYS.map(day => {
          const found = existingSchedules.find(s => s.day_of_week === day);
          return found || {
            day_of_week: day,
            start_time: '08:00',
            end_time: '17:00',
            is_active: day !== 'Chủ nhật',
            note: ''
          };
        });

        setProfile({
          full_name: data.name || data.user_id?.full_name || '',
          phone: data.phone || data.user_id?.phone || '',
          email: data.email || data.user_id?.email || '',
          avatar_url: data.avatar_url || data.user_id?.avatar_url || '',
          specialty: data.specialty || 'Đa khoa thú y',
          experience_years: data.experience_years || 1,
          consultation_fee: data.consultation_fee || 150000,
          license_number: data.license_number || '',
          education: data.education || '',
          bio: data.bio || '',
          schedules: fullSchedules,
          clinic: data.clinic_id || null
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ bác sĩ:', error);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải thông tin hồ sơ bác sĩ.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleScheduleChange = (index, field, value) => {
    const updated = [...profile.schedules];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, schedules: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.put('/veterinarians/me', {
        full_name: profile.full_name,
        phone: profile.phone,
        specialty: profile.specialty,
        experience_years: Number(profile.experience_years),
        consultation_fee: Number(profile.consultation_fee),
        license_number: profile.license_number,
        education: profile.education,
        bio: profile.bio,
        schedules: profile.schedules
      });

      showAlert({
        title: 'Thành công',
        message: 'Đã cập nhật hồ sơ và lịch làm việc thành công!',
        type: 'success'
      });
      fetchProfile();
    } catch (error) {
      showAlert({
        title: 'Lỗi cập nhật',
        message: error.response?.data?.message || 'Không thể lưu thay đổi.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarSrc = (avatar_url) => {
    if (!avatar_url) return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';
    if (avatar_url.startsWith('http')) return avatar_url;
    let path = avatar_url.replace(/\\/g, '/');
    if (!path.startsWith('/')) path = '/' + path;
    return `http://localhost:5000${path}`;
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Đang tải thông tin hồ sơ bác sĩ...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>Hồ sơ Bác sĩ & Lịch trực</span> 🩺
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Cập nhật thông tin chuyên môn, số chứng chỉ và lịch làm việc trong tuần của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic & Professional Info Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <img
              src={getAvatarSrc(profile.avatar_url)}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md"
            />
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.full_name ? `BS. ${profile.full_name}` : 'Bác sĩ Thú y'}
              </h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">
                  ✓ Bác sĩ đã xác thực
                </span>
                {profile.clinic && (
                  <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 size={12} /> {profile.clinic.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Họ và tên Bác sĩ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Chuyên khoa điều trị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đa khoa thú y, Ngoại khoa, Da liễu thú cưng..."
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Số năm kinh nghiệm
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Giá khám / Phí tư vấn (VND)
              </label>
              <input
                type="number"
                step={10000}
                value={profile.consultation_fee}
                onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Số chứng chỉ hành nghề thú y
              </label>
              <input
                type="text"
                placeholder="Ví dụ: CCHNTY-2024-HN-081"
                value={profile.license_number}
                onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Trình độ học vấn & Chứng chỉ đào tạo
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Bác sĩ Thú y - Học viện Nông nghiệp Việt Nam, Chứng chỉ Phẫu thuật Ngoại khoa..."
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Giới thiệu bản thân & Kinh nghiệm chuyên sâu
              </label>
              <textarea
                rows={3}
                placeholder="Chia sẻ đôi nét về quá trình công tác, phương châm khám chữa bệnh..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* Weekly Work Schedule Configuration */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-primary" size={20} /> Lịch làm việc trong tuần
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Hệ thống sẽ dựa vào khung giờ này để khách hàng và phòng khám sắp xếp lịch hẹn
            </p>
          </div>

          <div className="space-y-3">
            {profile.schedules.map((sch, index) => (
              <div
                key={sch.day_of_week}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  sch.is_active ? 'bg-slate-50/70 border-slate-200' : 'bg-gray-50/30 border-gray-100 opacity-60'
                }`}
              >
                {/* Day name & toggle */}
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    id={`active-${index}`}
                    checked={sch.is_active}
                    onChange={(e) => handleScheduleChange(index, 'is_active', e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                  />
                  <label htmlFor={`active-${index}`} className="font-bold text-gray-800 text-sm cursor-pointer select-none">
                    {sch.day_of_week}
                  </label>
                </div>

                {/* Time range inputs */}
                {sch.is_active ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Từ</span>
                      <input
                        type="time"
                        value={sch.start_time || '08:00'}
                        onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Đến</span>
                      <input
                        type="time"
                        value={sch.end_time || '17:00'}
                        onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Không nhận lịch khám</span>
                )}

                {/* Status indicator */}
                <div className="w-28 text-right hidden sm:block">
                  {sch.is_active ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      ● Đang mở lịch
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      Nghỉ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Đang lưu thông tin...' : 'Lưu toàn bộ thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VeterinarianProfile;
