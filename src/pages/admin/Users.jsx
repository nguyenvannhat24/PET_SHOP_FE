import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Shield, Lock, 
  Unlock, Trash2, Edit, Check, X, Phone, Mail, UserCheck
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const UsersManagement = () => {
  const { showAlert, showConfirm } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'PET_OWNER',
    address: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải danh sách người dùng.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const actionText = nextStatus === 'BLOCKED' ? 'khóa tài khoản' : 'mở khóa tài khoản';

    const confirmed = await showConfirm({
      title: `${nextStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản?`,
      message: `Bạn có chắc chắn muốn ${actionText} của ${user.full_name} (${user.email})?`,
      confirmText: nextStatus === 'BLOCKED' ? 'Xác nhận khóa' : 'Mở khóa',
      cancelText: 'Hủy bỏ',
      type: nextStatus === 'BLOCKED' ? 'danger' : 'info'
    });

    if (!confirmed) return;

    try {
      await apiClient.patch(`/admin/users/${user._id}/status`, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u))
      );
      showAlert({
        title: 'Thành công',
        message: `Đã ${actionText} thành công.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái người dùng:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể thay đổi trạng thái người dùng.',
        type: 'error'
      });
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return;

    const confirmed = await showConfirm({
      title: 'Đổi vai trò người dùng?',
      message: `Bạn có chắc chắn muốn thay đổi vai trò của "${user.full_name}" sang "${newRole}"?`,
      confirmText: 'Đồng ý',
      cancelText: 'Hủy',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      await apiClient.put(`/admin/users/${user._id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
      showAlert({
        title: 'Cập nhật thành công',
        message: `Đã cấp vai trò "${newRole}" cho người dùng.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi khi đổi vai trò:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể đổi vai trò.',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = await showConfirm({
      title: 'Xóa tài khoản vĩnh viễn?',
      message: `Hành động này không thể hoàn tác. Bạn có chắc muốn xóa tài khoản "${user.full_name}"?`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await apiClient.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      showAlert({
        title: 'Đã xóa',
        message: 'Tài khoản người dùng đã được xóa khỏi hệ thống.',
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi khi xóa tài khoản:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể xóa tài khoản này.',
        type: 'error'
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/admin/users', formData);
      showAlert({
        title: 'Tạo tài khoản thành công 🎉',
        message: `Tài khoản cho "${formData.full_name}" đã sẵn sàng sử dụng.`,
        type: 'success'
      });
      setIsCreateModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'PET_OWNER',
        address: ''
      });
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi tạo tài khoản:', err);
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể tạo tài khoản.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500" size={24} />
            <span>Quản lý Người dùng Toàn hệ thống</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Xem toàn bộ tài khoản, phân quyền vai trò (Chủ nuôi, Bác sĩ, Phòng khám, Admin) và xử lý khóa tài khoản
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm người dùng mới</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/60"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Vai trò:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="PET_OWNER">🐾 Chủ thú cưng</option>
              <option value="VETERINARIAN">👨‍⚕️ Bác sĩ thú y</option>
              <option value="CLINIC">🏥 Phòng khám</option>
              <option value="ADMIN">👑 Quản trị viên</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">✅ Đang hoạt động</option>
              <option value="BLOCKED">🔒 Đang bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500">Đang tải danh sách người dùng...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-5xl">👤</div>
            <h3 className="font-bold text-gray-800 text-base">Không tìm thấy người dùng nào</h3>
            <p className="text-xs text-gray-400">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-400 uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Người dùng</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Vai trò (Role)</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Ngày tạo</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isBlocked = u.status === 'BLOCKED';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 font-extrabold flex items-center justify-center shrink-0">
                            {u.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{u.full_name}</div>
                            {u.address && (
                              <div className="text-[11px] text-gray-400 line-clamp-1">{u.address}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Phone size={12} className="text-gray-400" />
                          <span>{u.phone || 'Chưa cập nhật'}</span>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-4 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                          <option value="PET_OWNER">🐾 PET_OWNER (Chủ nuôi)</option>
                          <option value="VETERINARIAN">👨‍⚕️ VETERINARIAN (Bác sĩ)</option>
                          <option value="CLINIC">🏥 CLINIC (Phòng khám)</option>
                          <option value="ADMIN">👑 ADMIN (Quản trị)</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isBlocked 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isBlocked ? <Lock size={11} /> : <Check size={11} />}
                          <span>{isBlocked ? 'Đang bị khóa' : 'Hoạt động'}</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-gray-500">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                            title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản này'}
                          >
                            {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Xóa vĩnh viễn"
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

      {/* Modal Thêm người dùng mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                <span>Tạo Tài khoản Người dùng Mới</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Vai trò khởi tạo
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium bg-white"
                  >
                    <option value="PET_OWNER">🐾 Chủ thú cưng</option>
                    <option value="VETERINARIAN">👨‍⚕️ Bác sĩ thú y</option>
                    <option value="CLINIC">🏥 Phòng khám</option>
                    <option value="ADMIN">👑 Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quận Cầu Giấy, Hà Nội"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs font-medium"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow text-xs transition-all cursor-pointer"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo tài khoản ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
