import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const ClinicCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/clinics/my-customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Lọc theo từ khóa tìm kiếm
  const filteredCustomers = customers.filter(c => {
    if (!search.trim()) return true;
    const kw = search.toLowerCase();
    const nameMatch = (c.full_name || '').toLowerCase().includes(kw);
    const phoneMatch = (c.phone || '').includes(kw);
    const emailMatch = (c.email || '').toLowerCase().includes(kw);
    const petMatch = (c.pets || []).some(p => (p.name || '').toLowerCase().includes(kw));
    return nameMatch || phoneMatch || emailMatch || petMatch;
  });

  // Tính các con số thống kê
  const totalCustomers = customers.length;
  const loyalCustomers = customers.filter(c => c.total_visits >= 2).length;
  const totalPetsCared = customers.reduce((sum, c) => sum + (c.pets?.length || 0), 0);
  const totalCompletedVisits = customers.reduce((sum, c) => sum + (c.completed_visits || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Chờ duyệt</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã hoàn thành</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Khách hàng 👥</h1>
          <p className="text-gray-500 mt-2">Danh sách chủ thú cưng đã từng đặt lịch khám và sử dụng dịch vụ tại Shop của bạn</p>
        </div>
      </div>

      {/* Thống kê CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black">
            👥
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tổng khách hàng</p>
            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black">
            ⭐
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Khách thân thiết</p>
            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : loyalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-black">
            🐾
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Thú cưng phục vụ</p>
            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : totalPetsCared}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl font-black">
            ✅
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Lượt khám xong</p>
            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : totalCompletedVisits}</h3>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-96 relative">
          <span className="absolute left-4 top-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, email hoặc thú cưng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
          />
        </div>
        <div className="text-xs text-gray-500 font-semibold">
          Hiển thị <strong>{filteredCustomers.length}</strong> / {totalCustomers} khách hàng
        </div>
      </div>

      {/* Danh sách Khách hàng */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-3">👥</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có dữ liệu khách hàng</h3>
          <p className="text-gray-500 text-sm">
            {customers.length === 0 
              ? "Khách hàng sẽ tự động xuất hiện ở đây khi họ đặt lịch khám tại Shop của bạn." 
              : "Không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={customer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.full_name || 'Khách')}&background=random`}
                      alt={customer.full_name}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-2">
                        {customer.full_name || 'Khách vãng lai'}
                        {customer.total_visits >= 2 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Thân thiết</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>📞</span> {customer.phone || 'Chưa cập nhật SĐT'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                      {customer.total_visits} lần khám
                    </span>
                  </div>
                </div>

                {/* Thông tin liên hệ & địa chỉ */}
                <div className="bg-gray-50/70 p-3.5 rounded-2xl text-xs text-gray-600 space-y-1 mb-4">
                  <p><strong>Email:</strong> {customer.email || 'Chưa có'}</p>
                  <p><strong>Địa chỉ:</strong> {customer.address || 'Chưa cập nhật'}</p>
                  <p><strong>Lần ghé gần nhất:</strong> {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>

                {/* Danh sách Thú cưng của khách */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span>🐾</span> Thú cưng ({customer.pets?.length || 0}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(customer.pets || []).map(p => (
                      <span key={p._id} className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-xl text-xs font-semibold flex items-center gap-1 border border-teal-100">
                        <span>🐶</span> {p.name} ({p.species || 'Thú cưng'})
                      </span>
                    ))}
                    {(!customer.pets || customer.pets.length === 0) && (
                      <span className="text-xs text-gray-400 italic">Chưa có thông tin</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>📞</span> Gọi điện
                  </a>
                )}
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="flex-1 py-2.5 px-4 bg-primary text-white hover:bg-opacity-90 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>📋</span> Xem Hồ sơ & Lịch sử khám ({customer.appointments?.length || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lịch sử khám bệnh của Khách hàng */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustomer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.full_name || 'Khách')}&background=random`}
                  alt={selectedCustomer.full_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-gray-500">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500 font-bold text-2xl">×</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <h4 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-1.5">
                <span>📑</span> Lịch sử các lần đặt khám tại Shop ({selectedCustomer.appointments?.length || 0}):
              </h4>

              {(!selectedCustomer.appointments || selectedCustomer.appointments.length === 0) ? (
                <p className="text-center py-10 text-gray-400 text-sm">Chưa có lịch sử khám bệnh nào.</p>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.appointments.map((appt, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-gray-900 text-sm">
                            🐾 Bé {appt.pet?.name || 'Thú cưng'} ({appt.pet?.species || 'N/A'})
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            🕒 {appt.start_time} - {new Date(appt.appointment_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>

                      <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                        <p><strong>Bác sĩ khám:</strong> {appt.veterinarian?.name || 'Chưa chỉ định'}</p>
                        <p><strong>Lý do khám:</strong> {appt.reason || 'Khám tổng quát'}</p>
                        {appt.symptoms && <p><strong>Triệu chứng:</strong> {appt.symptoms}</p>}
                        {appt.notes && <p><strong>Ghi chú:</strong> {appt.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicCustomers;
