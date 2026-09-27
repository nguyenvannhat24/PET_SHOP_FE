import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import apiClient from '../../services/apiClient';
import getImageUrl from '../../utils/imageUrl';

const ALL_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const CLINIC_TYPES = [
  { value: 'VETERINARY_CLINIC', label: '🏥 Phòng khám Thú y' },
  { value: 'PET_HOSPITAL', label: '🏨 Bệnh viện Thú y' },
  { value: 'PET_SHOP', label: '🛍️ Pet Shop & Phụ kiện' },
  { value: 'PET_SPA', label: '✂️ Spa & Làm đẹp thú cưng' },
  { value: 'PET_HOTEL', label: '🐾 Khách sạn Thú cưng' },
];

const ClinicProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    name: '',
    type: 'VETERINARY_CLINIC',
    phone: '',
    email: '',
    address: '',
    description: '',
    opening_time: '08:00',
    closing_time: '20:00',
    working_days: ALL_DAYS,
    status: 'ACTIVE',
    logo_url: ''
  });

  const [hasClinic, setHasClinic] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Load clinic data
  useEffect(() => {
    const fetchClinic = async () => {
      setFetching(true);
      try {
        const response = await apiClient.get('/clinics/my-clinic');
        const data = response.data.data;
        if (data) {
          setHasClinic(true);
          setFormData({
            name: data.name || '',
            type: data.type || 'VETERINARY_CLINIC',
            phone: data.phone || user?.phone || '',
            email: data.email || user?.email || '',
            address: data.address || '',
            description: data.description || '',
            opening_time: data.opening_time || '08:00',
            closing_time: data.closing_time || '20:00',
            working_days: data.working_days && data.working_days.length > 0 ? data.working_days : ALL_DAYS,
            status: data.status || 'ACTIVE',
            logo_url: data.logo_url || ''
          });
          if (data.logo_url) {
            setAvatarPreview(getAvatarSrc(data.logo_url));
          }
        } else {
          // Chưa có shop, khởi tạo mặc định theo thông tin user
          setHasClinic(false);
          setFormData(prev => ({
            ...prev,
            name: user?.full_name ? `Phòng khám Thú y ${user.full_name}` : '',
            phone: user?.phone || '',
            email: user?.email || ''
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin phòng khám:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchClinic();
  }, [user]);

  const getAvatarSrc = (avatar_url) => {
    return getImageUrl(avatar_url, 'https://via.placeholder.com/150?text=Clinic');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleWorkingDay = (day) => {
    setFormData(prev => {
      const exists = prev.working_days.includes(day);
      let updated;
      if (exists) {
        updated = prev.working_days.filter(d => d !== day);
      } else {
        updated = [...prev.working_days, day];
      }
      return { ...prev, working_days: updated };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      let finalLogoUrl = formData.logo_url || user?.avatar_url;

      // 1. Upload ảnh nếu có chọn file mới
      if (avatar) {
        const formDataImg = new FormData();
        formDataImg.append('image', avatar);
        const uploadRes = await apiClient.post('/upload/', formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data) {
          finalLogoUrl = uploadRes.data.url || uploadRes.data.fileUrl || uploadRes.data.avatar_url || (uploadRes.data.data && uploadRes.data.data.url) || finalLogoUrl;
        }
      }

      // 2. Cập nhật hoặc mở phòng khám qua API /clinics/my-clinic
      const payload = {
        ...formData,
        logo_url: finalLogoUrl
      };

      const res = await apiClient.put('/clinics/my-clinic', payload);

      if (res.data.success) {
        setHasClinic(true);
        setMessage(hasClinic ? 'Cập nhật thông tin phòng khám thành công!' : 'Chúc mừng bạn đã mở Shop / Phòng khám thành công!');
        // Đồng bộ avatar vào Redux user
        dispatch(updateUser({
          full_name: formData.name,
          avatar_url: finalLogoUrl,
        }));
      }
    } catch (err) {
      console.error("Lỗi lưu thông tin:", err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {hasClinic ? 'Quản lý Shop & Phòng khám 🏥' : 'Mở Shop / Phòng khám mới 🏥'}
          </h1>
          <p className="text-gray-500 mt-2">
            {hasClinic
              ? 'Cập nhật thông tin nhận diện, địa chỉ và lịch hoạt động để khách hàng dễ dàng tìm kiếm'
              : 'Thiết lập thông tin để bắt đầu đón nhận khách hàng và gán bác sĩ vào hệ thống'}
          </p>
        </div>
        {hasClinic && (
          <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${formData.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
            ● {formData.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm nghỉ'}
          </span>
        )}
      </div>

      {!hasClinic && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4 shadow-sm">
          <span className="text-3xl">ℹ️</span>
          <div>
            <h3 className="text-lg font-bold text-amber-900">Bạn chưa mở Shop / Phòng khám</h3>
            <p className="text-sm text-amber-700 mt-1">
              Hãy hoàn thiện form bên dưới để tạo Shop của bạn. Sau khi tạo xong, bạn có thể gán các bác sĩ vào shop và quản lý toàn diện lịch khám cũng như các dịch vụ!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-teal-500 via-emerald-500 to-primary relative"></div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit}>

            {/* Logo Upload */}
            <div className="relative -mt-16 mb-8 flex justify-between items-end flex-wrap gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <img
                  src={avatarPreview || getAvatarSrc(formData.logo_url || user?.avatar_url)}
                  alt="Clinic Logo"
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                />
                <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-bold text-xs text-white flex flex-col items-center">
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Đổi Logo
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 hover:-translate-y-0.5 hover:shadow-xl'
                }`}
              >
                {loading ? 'Đang lưu...' : hasClinic ? '💾 Lưu Thay Đổi' : '🚀 Mở Shop Ngay'}
              </button>
            </div>

            {message && (
              <div className="p-4 mb-6 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl font-semibold flex items-center gap-2">
                <span>✅</span> {message}
              </div>
            )}
            {error && (
              <div className="p-4 mb-6 text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl font-semibold flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Thông tin cơ bản của Shop */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span>🏢</span> Thông tin Shop / Cơ sở
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Shop / Phòng khám *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="VD: Phòng khám Thú y PetCare Sài Gòn"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Loại hình cơ sở *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium bg-white"
                  >
                    {CLINIC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại hotline *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="VD: 0912 345 678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="clinic@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ chi tiết cơ sở *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="VD: Số 123 Đường Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả giới thiệu cơ sở</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="Giới thiệu về cơ sở vật chất, đội ngũ y bác sĩ, các dịch vụ chuyên khoa nổi bật..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Lịch hoạt động của Phòng khám */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span>⏰</span> Lịch Hoạt Động & Giờ Mở Cửa của Phòng Khám
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ mở cửa hàng ngày *</label>
                  <input
                    type="time"
                    name="opening_time"
                    value={formData.opening_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ đóng cửa hàng ngày *</label>
                  <input
                    type="time"
                    name="closing_time"
                    value={formData.closing_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Các ngày mở cửa trong tuần *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map(day => {
                    const isSelected = formData.working_days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Bấm vào ngày để bật/tắt ngày hoạt động của phòng khám.</p>
              </div>
            </div>

            {/* Trạng thái hoạt động */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span>⚙️</span> Cài đặt Trạng thái
              </h2>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={formData.status === 'ACTIVE'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-gray-800">Đang hoạt động (Đón tiếp khách đặt lịch)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="INACTIVE"
                    checked={formData.status === 'INACTIVE'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-gray-500">Tạm nghỉ (Không nhận lịch khám mới)</span>
                </label>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ClinicProfile;
