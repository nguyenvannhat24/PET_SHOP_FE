import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import getImageUrl from '../../utils/imageUrl';

const MOCK_CLINICS = [
  {
    _id: 'mock1',
    name: 'Phòng khám Thú y PetCare Sài Gòn',
    address: '123 Đường Sư Vạn Hạnh, Q10, TP.HCM',
    average_rating: 4.8,
    total_reviews: 124,
    logo_url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    opening_time: '08:00',
    closing_time: '20:00'
  },
  {
    _id: 'mock2',
    name: 'Bệnh viện Thú y Quốc tế VET',
    address: '45 Nguyễn Đình Chiểu, Q3, TP.HCM',
    average_rating: 4.9,
    total_reviews: 89,
    logo_url: 'https://images.unsplash.com/photo-1628009368231-7bb7cbcb8127?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    opening_time: '07:30',
    closing_time: '21:00'
  },
  {
    _id: 'mock3',
    name: 'Phòng khám Animal Health Center',
    address: '88 Lê Văn Sỹ, Phú Nhuận, TP.HCM',
    average_rating: 4.7,
    total_reviews: 210,
    logo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    opening_time: '08:00',
    closing_time: '19:30'
  }
];

const Home = () => {
  const [clinics, setClinics] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await apiClient.get('/clinics');
        const data = res.data.data || [];
        if (data.length > 0) {
          setClinics(data.slice(0, 3));
        } else {
          setClinics(MOCK_CLINICS);
        }
      } catch (err) {
        setClinics(MOCK_CLINICS);
      }
    };
    fetchClinics();
  }, []);

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Happy Pets"
            className="w-full h-full object-cover"
          />
          {/* Overlay to make text readable */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Chăm sóc thú cưng của bạn tốt hơn mỗi ngày 🐾
          </h1>
          <p className="text-xl text-gray-100 mb-10 drop-shadow-md">
            Tìm kiếm phòng khám, chọn bác sĩ thú y và đặt lịch khám chăm sóc chu đáo nhất.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full flex items-center shadow-2xl border border-gray-200">
            <input
              type="text"
              placeholder="Tên phòng khám, cơ sở, dịch vụ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 bg-white text-black placeholder-gray-500 px-6 py-4 outline-none text-lg rounded-full"
            />

            <Link
              to={searchKeyword ? `/clinics?search=${encodeURIComponent(searchKeyword)}` : '/clinics'}
              className="bg-primary hover:bg-opacity-90 transition-colors text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg"
            >
              Tìm kiếm
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Quick Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Link to="/clinics" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 mb-4 bg-green-100 text-primary rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏥</div>
              <h3 className="font-bold text-gray-800 text-lg">Phòng khám & Shop</h3>
            </Link>
            <Link to="/clinics" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👨‍⚕️</div>
              <h3 className="font-bold text-gray-800 text-lg">Bác sĩ thú y</h3>
            </Link>
            <Link to="/clinics" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 mb-4 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🛍️</div>
              <h3 className="font-bold text-gray-800 text-lg">Cửa hàng Pet Shop</h3>
            </Link>
            <Link to="/clinics" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 mb-4 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">✂️</div>
              <h3 className="font-bold text-gray-800 text-lg">Dịch vụ Spa</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Clinics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Phòng khám & Shop Tiêu biểu ⭐</h2>
              <p className="text-gray-500">Các cơ sở được cộng đồng thú cưng tin cậy</p>
            </div>
            <Link to="/clinics" className="text-primary font-bold hover:underline hidden md:block">Xem tất cả ➔</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clinics.map(clinic => (
              <div key={clinic._id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={getImageUrl(clinic.logo_url || clinic.image, 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')}
                    alt={clinic.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold shadow flex items-center gap-1">
                    <span className="text-yellow-400">★</span> {clinic.average_rating || 5.0}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{clinic.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 flex-1 flex items-start gap-2">
                    <span className="text-gray-400">📍</span>
                    {clinic.address}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    ⏰ {clinic.opening_time || '08:00'} - {clinic.closing_time || '20:00'}
                  </p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                    <span className="text-sm text-gray-400">{clinic.total_reviews || 0} đánh giá</span>
                    <Link
                      to="/clinics"
                      className="bg-primary text-white hover:bg-opacity-90 px-5 py-2 rounded-xl font-bold transition-colors shadow hover:shadow-lg text-sm"
                    >
                      Xem Bác sĩ & Đặt lịch
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Call to Action */}
      <section className="py-20 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Bạn chưa có hồ sơ cho bé cưng? 🐕🐈</h2>
          <p className="text-xl text-white text-opacity-90 mb-10">
            Tạo ngay hồ sơ để theo dõi sức khỏe, lịch tiêm phòng và đặt lịch khám chữa bệnh tại các phòng khám uy tín nhất.
          </p>
          <Link to="/auth/register" className="inline-block bg-white text-secondary font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
            Đăng ký miễn phí ngay
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
