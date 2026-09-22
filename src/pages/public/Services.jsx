import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, Sparkles, Clock, MapPin, Phone, 
  Calendar, Check, ShieldCheck, ArrowUpDown, ChevronRight, Tag, MessageSquare
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import AppointmentModal from '../../components/modals/AppointmentModal';
import { useModal } from '../../context/ModalContext';

const Services = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const { showConfirm, showAlert } = useModal();

  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSpecies = searchParams.get('species') || 'ALL';
  const initialSearch = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSpecies, setSelectedSpecies] = useState(initialSpecies);
  const [searchKeyword, setSearchKeyword] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc, duration_asc

  // Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingClinicId, setBookingClinicId] = useState('');
  const [bookingServiceId, setBookingServiceId] = useState('');

  // Fetch Categories & Clinics
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, clinicRes] = await Promise.all([
          apiClient.get('/services/categories'),
          apiClient.get('/clinics')
        ]);
        setCategories(catRes.data.data || []);
        setClinics(clinicRes.data.data || []);
      } catch (err) {
        console.warn('Lỗi khi tải danh mục hoặc phòng khám:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch User Pets if logged in
  useEffect(() => {
    if (user) {
      const fetchPets = async () => {
        try {
          const res = await apiClient.get('/pets');
          setUserPets(res.data.data || []);
        } catch (err) {
          console.warn('Chưa lấy được danh sách thú cưng:', err);
        }
      };
      fetchPets();
    }
  }, [user]);

  // Fetch Services based on filters
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword.trim()) params.append('q', searchKeyword.trim());
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category_id', selectedCategory);
      if (selectedSpecies && selectedSpecies !== 'ALL') params.append('species', selectedSpecies);
      if (sortBy) params.append('sort', sortBy);

      const res = await apiClient.get(`/services?${params.toString()}`);
      setServices(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách dịch vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, selectedSpecies, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const handleBookService = async (service) => {
    if (!user) {
      const confirmed = await showConfirm({
        title: 'Yêu cầu đăng nhập',
        message: 'Bạn cần đăng nhập để đặt lịch sử dụng dịch vụ cho bé cưng. Đăng nhập ngay bây giờ?',
        confirmText: 'Đăng nhập ngay',
        cancelText: 'Để sau',
        type: 'info'
      });
      if (confirmed) {
        navigate('/auth/login');
      }
      return;
    }

    setBookingClinicId(service.clinic_id?._id || '');
    setBookingServiceId(service._id);
    setIsModalOpen(true);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Liên hệ';
    return Number(price).toLocaleString('vi-VN') + ' đ';
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Bath': return '🛁';
      case 'Scissors': return '✂️';
      case 'Stethoscope': return '🩺';
      case 'Syringe': return '💉';
      case 'Hotel': return '🏨';
      case 'Sparkles': return '✨';
      default: return '🐾';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-100">
            <Sparkles size={14} className="text-amber-300" />
            <span>Dịch Vụ Chăm Sóc Thú Cưng Đẳng Cấp 5 Sao</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Gửi trọn yêu thương cho bé cưng 🐾
          </h1>
          
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Khám sức khỏe, combo spa cắt tỉa lông, tiêm vaccine định kỳ và khách sạn lưu trú cùng các phòng khám & chuyên gia hàng đầu.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1.5 border border-white/30">
              <Search className="text-gray-400 ml-3.5 mr-2 shrink-0" size={20} />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm dịch vụ (ví dụ: Spa tắm sấy, Cắt tỉa lông, Tiêm phòng dại...)"
                className="w-full py-2.5 px-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0 cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Category Pills Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>🌟</span>
              <span>Tất cả dịch vụ</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{getCategoryIcon(cat.icon)}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Filters & Results Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Species Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">
            <button
              onClick={() => setSelectedSpecies('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSpecies === 'ALL' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              Tất cả thú cưng
            </button>
            <button
              onClick={() => setSelectedSpecies('DOG')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSpecies === 'DOG' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              🐶 Dành cho Chó
            </button>
            <button
              onClick={() => setSelectedSpecies('CAT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSpecies === 'CAT' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              🐱 Dành cho Mèo
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <ArrowUpDown size={14} /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Mới cập nhật</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="duration_asc">Thời gian nhanh nhất</option>
            </select>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 text-sm font-medium">Đang tìm kiếm các dịch vụ phù hợp...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-lg mx-auto my-12 space-y-4">
            <div className="text-5xl">🛁</div>
            <h3 className="text-lg font-bold text-gray-800">Không tìm thấy dịch vụ nào</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Rất tiếc, chưa có dịch vụ nào phù hợp với bộ lọc hiện tại. Bạn vui lòng thử tìm với từ khóa khác hoặc xóa bộ lọc.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSpecies('ALL');
                setSearchKeyword('');
              }}
              className="px-5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const clinic = service.clinic_id || {};
              const cat = service.category_id || {};

              return (
                <div
                  key={service._id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Service Image & Badges */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={service.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80'}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-white/95 backdrop-blur-md text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                        <span>{getCategoryIcon(cat.icon)}</span>
                        <span>{cat.name || 'Dịch vụ'}</span>
                      </span>

                      {service.species && (
                        <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {service.species === 'DOG' ? '🐶 Chó' : service.species === 'CAT' ? '🐱 Mèo' : '🐾 Mọi thú cưng'}
                        </span>
                      )}
                    </div>

                    {/* Duration Bottom Overlay */}
                    {service.duration_minutes && (
                      <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        <Clock size={12} className="text-emerald-300" />
                        <span>Khoảng {service.duration_minutes} phút</span>
                      </div>
                    )}
                  </div>

                  {/* Service Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {service.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {service.description || 'Dịch vụ chăm sóc và làm đẹp chuyên nghiệp cho thú cưng.'}
                      </p>
                    </div>

                    {/* Clinic Box */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="text-emerald-600 font-extrabold">🏥</span>
                        <span className="truncate">{clinic.name || 'Phòng khám thú y'}</span>
                      </div>
                      {clinic.address && (
                        <div className="text-gray-500 flex items-center gap-1.5 text-[11px] truncate">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{clinic.address}</span>
                        </div>
                      )}
                      {clinic.phone && (
                        <div className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <Phone size={12} className="text-gray-400 shrink-0" />
                          <span>Hotline: {clinic.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Giá niêm yết
                        </span>
                        <span className="text-lg font-black text-emerald-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {service.clinic_id?.owner_id && (
                          <button
                            onClick={() => {
                              const targetId = typeof service.clinic_id.owner_id === 'object'
                                ? service.clinic_id.owner_id._id
                                : service.clinic_id.owner_id;
                              if (!user) {
                                navigate('/auth/login');
                              } else {
                                navigate(`/chat?targetUserId=${targetId}`);
                              }
                            }}
                            title="Nhắn tin tư vấn với cơ sở này"
                            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => handleBookService(service)}
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calendar size={14} />
                          <span>Đặt lịch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Modal with preSelectedServiceId & preSelectedClinicId */}
      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pets={userPets}
          clinics={clinics}
          preSelectedClinicId={bookingClinicId}
          preSelectedServiceId={bookingServiceId}
          onSave={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Services;
