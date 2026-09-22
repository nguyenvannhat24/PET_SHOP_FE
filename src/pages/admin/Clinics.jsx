import React, { useState, useEffect } from 'react';
import { 
  Building, Search, Filter, Edit, Trash2, Phone, 
  MapPin, User, Stethoscope, Scissors, Clock, X, Check, Mail
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const ClinicsManagement = () => {
  const { showAlert, showConfirm } = useModal();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'VETERINARY_CLINIC',
    phone: '',
    email: '',
    address: '',
    opening_time: '08:00',
    closing_time: '20:00'
  });

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedType !== 'ALL') params.append('type', selectedType);

      const res = await apiClient.get(`/admin/clinics?${params.toString()}`);
      setClinics(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phòng khám:', err);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải danh sách phòng khám.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClinics();
  };

  const handleOpenEditModal = (clinic) => {
    setEditingClinicId(clinic._id);
    setFormData({
      name: clinic.name || '',
      type: clinic.type || 'VETERINARY_CLINIC',
      phone: clinic.phone || '',
      email: clinic.email || '',
      address: clinic.address || '',
      opening_time: clinic.opening_time || '08:00',
      closing_time: clinic.closing_time || '20:00'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put(`/admin/clinics/${editingClinicId}`, formData);
      showAlert({
        title: 'Thành công',
        message: 'Thông tin phòng khám đã được cập nhật.',
        type: 'success'
      });
      setIsEditModalOpen(false);
      fetchClinics();
    } catch (err) {
      console.error('Lỗi khi lưu phòng khám:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể lưu thông tin phòng khám.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClinic = async (clinic) => {
    const confirmed = await showConfirm({
      title: 'Xóa phòng khám này?',
      message: `Bạn có chắc muốn xóa phòng khám "${clinic.name}"? Dữ liệu lịch hẹn và dịch vụ của phòng khám này có thể bị ảnh hưởng.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await apiClient.delete(`/admin/clinics/${clinic._id}`);
      setClinics((prev) => prev.filter((c) => c._id !== clinic._id));
      showAlert({
        title: 'Đã xóa',
        message: 'Phòng khám đã được xóa khỏi hệ thống.',
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi khi xóa phòng khám:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể xóa phòng khám.',
        type: 'error'
      });
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'PET_HOSPITAL': return { label: 'Bệnh viện Thú y', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'PET_SPA': return { label: 'Spa Grooming', color: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'PET_HOTEL': return { label: 'Khách sạn Thú cưng', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PET_SHOP': return { label: 'Pet Shop', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: 'Phòng khám Thú y', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="text-emerald-600" size={24} />
            <span>Quản lý Cơ sở Phòng khám & Shop</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tất cả các cơ sở thú y trên nền tảng, số lượng bác sĩ trực và các gói dịch vụ niêm yết
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-gray-400">Tổng số cơ sở:</span>
          <span className="text-xl font-extrabold text-gray-900 ml-2">{clinics.length}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên phòng khám, địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/60"
          />
        </form>

        {/* Type Filter */}
        <div className="flex items-center gap-2 text-xs w-full md:w-auto">
          <span className="text-gray-500 font-medium">Loại hình:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="ALL">Tất cả loại hình</option>
            <option value="VETERINARY_CLINIC">🏥 Phòng khám Thú y</option>
            <option value="PET_HOSPITAL">🏨 Bệnh viện Thú y</option>
            <option value="PET_SPA">✂️ Spa & Cắt tỉa</option>
            <option value="PET_HOTEL">🐾 Khách sạn Thú cưng</option>
            <option value="PET_SHOP">🛍️ Pet Shop Phụ kiện</option>
          </select>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500">Đang tải danh sách cơ sở...</p>
          </div>
        ) : clinics.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-5xl">🏥</div>
            <h3 className="font-bold text-gray-800 text-base">Chưa có cơ sở phòng khám nào</h3>
            <p className="text-xs text-gray-400">Không tìm thấy cơ sở nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-400 uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Tên Phòng khám & Loại hình</th>
                  <th className="py-3.5 px-4">Địa chỉ & Liên hệ</th>
                  <th className="py-3.5 px-4">Chủ sở hữu</th>
                  <th className="py-3.5 px-4 text-center">Bác sĩ</th>
                  <th className="py-3.5 px-4 text-center">Dịch vụ</th>
                  <th className="py-3.5 px-4">Giờ mở cửa</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clinics.map((c) => {
                  const typeInfo = getTypeLabel(c.type);

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Type */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Address & Contact */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 max-w-[200px] truncate">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{c.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Phone size={12} className="text-gray-400 shrink-0" />
                          <span>{c.phone || 'Chưa có SĐT'}</span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4">
                        {c.owner_id ? (
                          <div>
                            <div className="font-bold text-gray-900">{c.owner_id.full_name}</div>
                            <div className="text-[11px] text-gray-400">{c.owner_id.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Chưa liên kết</span>
                        )}
                      </td>

                      {/* Doctors count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-extrabold">
                          <Stethoscope size={12} />
                          <span>{c.vetsCount || 0}</span>
                        </span>
                      </td>

                      {/* Services count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold">
                          <Scissors size={12} />
                          <span>{c.servicesCount || 0}</span>
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock size={11} className="text-gray-400" />
                          <span>{c.opening_time || '08:00'} - {c.closing_time || '20:00'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-2 rounded-xl bg-slate-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteClinic(c)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Xóa phòng khám"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa Phòng khám */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Building size={18} className="text-emerald-600" />
                <span>Chỉnh sửa Thông tin Cơ sở</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClinic} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên Phòng khám / Shop <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Loại hình</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium bg-white"
                  >
                    <option value="VETERINARY_CLINIC">🏥 Phòng khám Thú y</option>
                    <option value="PET_HOSPITAL">🏨 Bệnh viện Thú y</option>
                    <option value="PET_SPA">✂️ Spa & Cắt tỉa</option>
                    <option value="PET_HOTEL">🐾 Khách sạn Thú cưng</option>
                    <option value="PET_SHOP">🛍️ Pet Shop Phụ kiện</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số điện thoại hotline</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giờ mở cửa</label>
                  <input
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giờ đóng cửa</label>
                  <input
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow text-xs transition-all cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicsManagement;
