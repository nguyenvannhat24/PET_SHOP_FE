import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import getImageUrl from '../../utils/imageUrl';

const OwnerDashboard = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await apiClient.get('/pets');
        setPets(response.data.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thú cưng ở Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  const getAvatarSrc = (url) => {
    return getImageUrl(url, 'https://via.placeholder.com/150?text=Pet');
  };

  const calculateAge = (dob) => {
    if (!dob) return 'Chưa rõ tuổi';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} tuổi` : 'Dưới 1 tuổi';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan của bạn 🐾</h1>
        <p className="text-gray-500 mt-2">Theo dõi sức khỏe và lịch hẹn của các bé cưng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl">🐕</div>
          <div>
            <p className="text-gray-500 text-sm">Thú cưng của tôi</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : pets.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">📅</div>
          <div>
            <p className="text-gray-500 text-sm">Lịch hẹn sắp tới</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl">📦</div>
          <div>
            <p className="text-gray-500 text-sm">Đơn hàng chờ giao</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>

      {/* My Pets Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Thú cưng của bạn</h2>
          <Link to="/owner/pets" className="text-primary font-bold hover:underline">
            Xem tất cả ➔
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <p className="text-gray-500 mb-2">Bạn chưa có hồ sơ thú cưng nào.</p>
            <Link to="/owner/pets" className="text-primary font-bold hover:underline">
              Thêm thú cưng ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pets.slice(0, 4).map((pet) => (
              <div key={pet._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <img 
                  src={getAvatarSrc(pet.avatar_url)} 
                  alt={pet.name} 
                  className="w-20 h-20 rounded-full object-cover" 
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{pet.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {pet.species} {pet.breed ? `• ${pet.breed}` : ''} • {calculateAge(pet.date_of_birth)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
