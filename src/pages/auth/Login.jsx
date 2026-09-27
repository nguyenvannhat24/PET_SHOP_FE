import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import apiClient from '../../services/apiClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error: authError } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(loginStart());

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const resData = response.data;
      const token = resData.token || resData.data?.token;
      const user = (resData.data && resData.data.user) ? resData.data.user : (resData.data || resData.user);

      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess({ user, accessToken: token }));

      // Role-based redirects
      if (user.role === 'PET_OWNER') {
        navigate('/owner/dashboard');
      } else if (user.role === 'CLINIC') {
        navigate('/clinic/dashboard');
      } else if (user.role === 'VETERINARIAN') {
        navigate('/veterinarian/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); // Default PET_OWNER
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setLocalError(errorMsg);
      dispatch(loginFailure());
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Pane - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary">
        <img
          src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="Cute dog"
          className="object-cover w-full h-full opacity-90"
        />
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-24 bg-white relative">
        <Link to="/" className="absolute top-8 right-8 text-gray-500 hover:text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          Trang chủ
        </Link>
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Chào mừng trở lại! 🐾</h1>
            <p className="text-gray-500">Đăng nhập để kết nối với cộng đồng Pet Connect</p>
          </div>

          {(localError || authError) && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              {localError || authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Nhập email của bạn"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                <a href="#" className="text-sm text-primary hover:underline font-medium">Quên mật khẩu?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-colors duration-300 shadow-lg mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 shadow-primary/30'}`}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-600">
            Chưa có tài khoản? <Link to="/auth/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
