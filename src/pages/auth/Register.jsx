import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PET_OWNER'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await apiClient.post('/auth/register', registerData);
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-row-reverse">
      {/* Right Pane - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary">
        <img
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="Cute cat"
          className="object-cover w-full h-full opacity-90"
        />
      </div>

      {/* Left Pane - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-12 bg-white relative">
        <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          Trang chủ
        </Link>
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tạo tài khoản 🐱</h1>
            <p className="text-gray-500">Tham gia cộng đồng yêu thú cưng lớn nhất</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-sm">Đăng ký thành công! Đang chuyển hướng...</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
              <input
                type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Nhập họ và tên" required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Số điện thoại" required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Loại tài khoản</label>
                <select
                  name="role" value={formData.role} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                >
                  <option value="PET_OWNER">Chủ thú cưng</option>
                  <option value="CLINIC">Phòng khám</option>
                  <option value="VETERINARIAN">Bác sĩ thú y</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Nhập email của bạn" required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Mật khẩu" required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận</label>
                <input
                  type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Nhập lại" required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-colors duration-300 shadow-lg mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 shadow-primary/30'}`}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Đã có tài khoản? <Link to="/auth/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
