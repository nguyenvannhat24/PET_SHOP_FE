import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import apiClient from '../../services/apiClient';
import getImageUrl from '../../utils/imageUrl';

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: '',
    role: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fileInputRef = useRef(null);

  // Lấy dữ liệu hồ sơ từ Backend khi vừa vào trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/users/profile');
        const data = response.data.data;
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            avatar_url: data.avatar_url || '',
            role: data.role || '',
          });
          // Đồng bộ lại với Redux phòng trường hợp khác nhau
          dispatch(updateUser(data));
        }
      } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error);
      }
    };

    fetchProfile();
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage({ text: '', type: '' });

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      // Gọi API Upload
      const response = await apiClient.post('/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newAvatarUrl = response.data.data.url;
      setFormData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      setMessage({ text: 'Tải ảnh lên thành công! Hãy bấm Lưu thông tin.', type: 'success' });
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      setMessage({ text: 'Tải ảnh thất bại. Vui lòng thử lại.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiClient.put('/users/profile', {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        avatar_url: formData.avatar_url,
      });

      const updatedUser = response.data.data;
      dispatch(updateUser(updatedUser)); // Cập nhật vào Redux

      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      setMessage({ text: error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Hàm helper để tạo link ảnh đầy đủ
  const getAvatarSrc = () => {
    return getImageUrl(formData.avatar_url, 'https://via.placeholder.com/150?text=Avatar');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Phần Header / Avatar */}
        <div className="bg-gradient-to-r from-primary to-secondary p-8 flex flex-col items-center justify-center text-white relative">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <img
              src={getAvatarSrc()}
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg bg-white"
            />
            {/* Lớp phủ khi hover */}
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="font-bold text-sm">Đổi ảnh</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <h2 className="text-2xl font-bold mt-4">{formData.full_name || 'Người dùng'}</h2>
          <span className="bg-black bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold mt-2">
            {formData.role === 'PET_OWNER' ? 'Chủ thú cưng' : formData.role}
          </span>
        </div>

        {/* Form thông tin */}
        <form onSubmit={handleSubmit} className="p-8">
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Không thể thay đổi)</label>
              <input
                type="email"
                value={formData.email}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className={`bg-primary text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg ${(loading || uploading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90 hover:shadow-xl hover:-translate-y-1 transform'
                }`}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
