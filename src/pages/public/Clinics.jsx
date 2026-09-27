import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AppointmentModal from '../../components/modals/AppointmentModal';
import { useModal } from '../../context/ModalContext';
import getImageUrl from '../../utils/imageUrl';

const Clinics = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { showConfirm } = useModal();

  const [clinics, setClinics] = useState([]);
  const [clinicDoctors, setClinicDoctors] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [userPets, setUserPets] = useState([]);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/clinics${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      const list = res.data.data || [];
      setClinics(list);

      // Tải trước bác sĩ cho từng phòng khám
      const doctorsMap = {};
      await Promise.all(
        list.slice(0, 10).map(async (c) => {
          try {
            const vetRes = await apiClient.get(`/veterinarians?clinic_id=${c._id}`);
            doctorsMap[c._id] = vetRes.data.data || [];
          } catch (e) {
            doctorsMap[c._id] = [];
          }
        })
      );
      setClinicDoctors(doctorsMap);
    } catch (err) {
      console.error("Lỗi khi tải danh sách phòng khám:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [search]);

  // Lấy danh sách thú cưng của user nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      const fetchPets = async () => {
        try {
          const res = await apiClient.get('/pets');
          setUserPets(res.data.data || []);
        } catch (err) {
          console.warn("Chưa lấy được danh sách thú cưng:", err);
        }
      };
      fetchPets();
    }
  }, [user]);

  const handleBookNow = async (clinicId) => {
    if (!user) {
      const confirmed = await showConfirm({
        title: 'Yêu cầu đăng nhập',
        message: 'Bạn cần đăng nhập để đặt lịch hẹn khám. Đi đến trang đăng nhập ngay?',
        confirmText: 'Đăng nhập ngay',
        cancelText: 'Để sau',
        type: 'info',
      });
      if (confirmed) {
        navigate('/auth/login');
      }
      return;
    }
    setSelectedClinicId(clinicId);
    setIsModalOpen(true);
  };

  const getClinicTypeLabel = (type) => {
    switch (type) {
      case 'PET_HOSPITAL': return '🏨 Bệnh viện Thú y';
      case 'PET_SHOP': return '🛍️ Pet Shop & Phụ kiện';
      case 'PET_SPA': return '✂️ Spa Thú cưng';
      case 'PET_HOTEL': return '🐾 Khách sạn Thú cưng';
      default: return '🏥 Phòng khám Thú y';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Hệ Thống Phòng Khám & Shop Thú Cưng 🏥
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
            Tìm kiếm phòng khám uy tín, xem đội ngũ bác sĩ chuyên khoa và đặt lịch khám chăm sóc cho thú cưng dễ dàng.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center">
            <span className="pl-4 text-gray-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Nhập tên phòng khám, địa chỉ, quận huyện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-800 outline-none text-base font-medium rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Danh sách Cơ sở ({clinics.length})
            </h2>
            <p className="text-sm text-gray-500">Các cơ sở y tế thú cưng đang hoạt động trên hệ thống</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : clinics.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa tìm thấy phòng khám phù hợp</h3>
            <p className="text-gray-500 text-sm">Thử tìm kiếm với từ khóa khác hoặc quay lại sau.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {clinics.map((clinic) => {
              const doctors = clinicDoctors[clinic._id] || [];
              return (
                <div key={clinic._id} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-8">
                  {/* Cột trái: Thông tin Shop */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={getImageUrl(clinic.logo_url, 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80')}
                        alt={clinic.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-2">
                          {getClinicTypeLabel(clinic.type)}
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 leading-snug">{clinic.name}</h3>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <span>📍</span> {clinic.address}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                      {clinic.description || 'Chuyên khám chữa bệnh, tiêm phòng, phẫu thuật và chăm sóc toàn diện cho chó mèo.'}
                    </p>

                    {/* Lịch hoạt động của Shop */}
                    <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-700 flex flex-wrap items-center gap-y-2 gap-x-6">
                      <div>
                        <span className="text-gray-400 font-semibold block">Giờ mở cửa:</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {clinic.opening_time || '08:00'} - {clinic.closing_time || '20:00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Ngày làm việc:</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {clinic.working_days && clinic.working_days.length > 0
                            ? clinic.working_days.join(', ')
                            : 'Cả tuần'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block">Hotline:</span>
                        <span className="font-bold text-emerald-700 text-sm">{clinic.phone || '090 000 0000'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Danh sách Bác sĩ trực thuộc Shop */}
                  <div className="lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                        <span>👨‍⚕️ Bác sĩ tại Shop:</span>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          {doctors.length} bác sĩ
                        </span>
                      </h4>

                      {doctors.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-4">Đang cập nhật danh sách bác sĩ trực...</p>
                      ) : (
                        <div className="space-y-3 mb-6">
                          {doctors.slice(0, 3).map((vet) => (
                            <div key={vet._id} className="flex items-center gap-3 p-2 bg-gray-50/70 rounded-xl">
                              <img
                                src={vet.avatar_url || (vet.user_id && vet.user_id.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || (vet.user_id && vet.user_id.full_name) || 'Doctor')}&background=random`}
                                alt={vet.name}
                                className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {vet.name || (vet.user_id && vet.user_id.full_name) || 'Bác sĩ'}
                                </p>
                                <p className="text-[11px] text-primary font-medium truncate">
                                  {vet.specialty || 'Đa khoa'}
                                </p>
                              </div>
                            </div>
                          ))}
                          {doctors.length > 3 && (
                            <p className="text-xs text-gray-400 text-center">+{doctors.length - 3} bác sĩ khác</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      <button
                        onClick={() => handleBookNow(clinic._id)}
                        className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-primary hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>📅</span> Đặt Lịch Khám Ngay
                      </button>

                      {clinic.owner_id && (
                        <button
                          onClick={() => {
                            const targetId = typeof clinic.owner_id === 'object' ? clinic.owner_id._id : clinic.owner_id;
                            if (!user) {
                              navigate('/auth/login');
                            } else {
                              navigate(`/chat?targetUserId=${targetId}`);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border border-emerald-200/60"
                        >
                          <span>💬</span> Nhắn tin tư vấn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Đặt Lịch */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pets={userPets}
        clinics={clinics}
        preSelectedClinicId={selectedClinicId}
        onSave={() => {
          setIsModalOpen(false);
          navigate('/owner/appointments');
        }}
      />
    </div>
  );
};

export default Clinics;
