import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Sparkles, Check, 
  X, AlertCircle, Clock, Tag, Eye, EyeOff, Scissors, Image as ImageIcon
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const SAMPLE_IMAGE_SUGGESTIONS = [
  { label: 'Spa tắm sấy', url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cắt tỉa lông', url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&auto=format&fit=crop&q=80' },
  { label: 'Khám thú y', url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&auto=format&fit=crop&q=80' },
  { label: 'Tiêm vaccine', url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Khách sạn lưu trú', url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80' }
];

const ClinicServices = () => {
  const { showAlert, showConfirm } = useModal();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    duration_minutes: 45,
    species: 'ALL',
    status: 'ACTIVE',
    image_url: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        apiClient.get('/services/my/all'),
        apiClient.get('/services/categories')
      ]);
      setServices(srvRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dịch vụ của phòng khám:', err);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentServiceId(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0]._id : '',
      price: '',
      duration_minutes: 45,
      species: 'ALL',
      status: 'ACTIVE',
      image_url: SAMPLE_IMAGE_SUGGESTIONS[0].url,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setIsEditing(true);
    setCurrentServiceId(service._id);
    setFormData({
      name: service.name || '',
      category_id: service.category_id?._id || service.category_id || '',
      price: service.price || '',
      duration_minutes: service.duration_minutes || 45,
      species: service.species || 'ALL',
      status: service.status || 'ACTIVE',
      image_url: service.image_url || '',
      description: service.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên dịch vụ và mức giá.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/services/${currentServiceId}`, formData);
        showAlert({
          title: 'Cập nhật thành công',
          message: `Đã lưu thay đổi cho dịch vụ "${formData.name}".`,
          type: 'success'
        });
      } else {
        await apiClient.post('/services', formData);
        showAlert({
          title: 'Đăng dịch vụ thành công 🎉',
          message: `Gói dịch vụ "${formData.name}" đã sẵn sàng cho khách hàng đặt lịch!`,
          type: 'success'
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Lỗi khi lưu dịch vụ:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể lưu dịch vụ. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      await apiClient.patch(`/services/${service._id}/toggle-status`);
      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id
            ? { ...item, status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
            : item
        )
      );
    } catch (err) {
      console.error('Lỗi khi chuyển trạng thái:', err);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể thay đổi trạng thái dịch vụ.',
        type: 'error'
      });
    }
  };

  const handleDeleteService = async (service) => {
    const confirmed = await showConfirm({
      title: 'Xóa dịch vụ?',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn dịch vụ "${service.name}" không?`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await apiClient.delete(`/services/${service._id}`);
      showAlert({
        title: 'Đã xóa',
        message: 'Dịch vụ đã được xóa thành công.',
        type: 'success'
      });
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xóa dịch vụ:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể xóa dịch vụ này.',
        type: 'error'
      });
    }
  };

  const filteredServices = services.filter((srv) => {
    if (selectedCategory !== 'ALL') {
      const catId = srv.category_id?._id || srv.category_id;
      if (catId !== selectedCategory) return false;
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchName = (srv.name || '').toLowerCase().includes(kw);
      const matchDesc = (srv.description || '').toLowerCase().includes(kw);
      return matchName || matchDesc;
    }
    return true;
  });

  const activeCount = services.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = services.filter((s) => s.status === 'INACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Scissors size={22} />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Gói Dịch vụ Thú cưng</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Đăng các gói dịch vụ (Spa, tắm sấy, khám chữa bệnh, tiêm chủng...) để khách hàng tìm kiếm và đặt lịch
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400">Tổng gói dịch vụ</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{services.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            📋
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400">Đang hoạt động</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ✅
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400">Tạm ngưng phục vụ</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{inactiveCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            ⏸️
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên dịch vụ..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Danh mục:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-medium"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services List / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500">Đang tải danh sách dịch vụ...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <div className="text-5xl">🛁</div>
          <h3 className="font-bold text-gray-800 text-base">Chưa có dịch vụ nào</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Hãy bắt đầu đăng các dịch vụ thế mạnh của cơ sở bạn để khách hàng có thể tìm thấy và đặt lịch dễ dàng.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Đăng dịch vụ đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const isActive = service.status === 'ACTIVE';
            const cat = service.category_id || {};

            return (
              <div
                key={service._id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Image & Header */}
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={service.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-700 text-white hover:bg-gray-800'
                        }`}
                        title="Bấm để bật/tắt trạng thái hiển thị"
                      >
                        {isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span>{isActive ? 'Đang mở' : 'Tạm dừng'}</span>
                      </button>
                    </div>

                    {/* Category & Species */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="bg-white/95 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                        {cat.name || 'Dịch vụ'}
                      </span>
                      {service.species && (
                        <span className="bg-primary/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {service.species === 'DOG' ? 'Cho Chó' : service.species === 'CAT' ? 'Cho Mèo' : 'Mọi bé'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{service.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {service.description || 'Chưa có mô tả chi tiết cho dịch vụ này.'}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-400" />
                        <span>{service.duration_minutes || 45} phút</span>
                      </span>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        {Number(service.price).toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="p-2 rounded-xl text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit size={14} />
                    <span>Sửa</span>
                  </button>

                  <button
                    onClick={() => handleDeleteService(service)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Chỉnh sửa Dịch vụ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Scissors size={18} className="text-primary" />
                <span>{isEditing ? 'Chỉnh sửa Gói Dịch vụ' : 'Đăng Gói Dịch vụ Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="overflow-y-auto p-6 space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tắm sấy khử mùi & Cắt móng cho Mèo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Danh mục dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Giá dịch vụ (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="Ví dụ: 150000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Thời gian thực hiện (Phút)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dành cho loài</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium bg-white"
                  >
                    <option value="ALL">🐾 Tất cả thú cưng</option>
                    <option value="DOG">🐶 Chuyên cho Chó</option>
                    <option value="CAT">🐱 Chuyên cho Mèo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ảnh minh họa dịch vụ (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium mb-2"
                />

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-400">Gợi ý ảnh nhanh:</span>
                  {SAMPLE_IMAGE_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: item.url })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-700 text-[10px] font-semibold transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả quy trình & Chi tiết dịch vụ</label>
                <textarea
                  rows="3"
                  placeholder="Ghi rõ các bước thực hiện, sản phẩm chăm sóc sử dụng, chế độ bảo hành hoặc lưu ý cho chủ nuôi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Trạng thái phục vụ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium bg-white"
                >
                  <option value="ACTIVE">✅ Đang hoạt động (Khách hàng có thể tìm thấy & đặt lịch)</option>
                  <option value="INACTIVE">⏸️ Tạm ngưng (Ẩn khỏi danh sách tìm kiếm)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow text-xs transition-all cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Đăng dịch vụ ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicServices;
