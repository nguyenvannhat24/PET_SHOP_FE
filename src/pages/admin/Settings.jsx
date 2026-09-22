import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Bell, Database, Check } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

const AdminSettings = () => {
  const { showAlert } = useModal();
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    siteName: 'Pet Connect',
    supportHotline: '1900 6868',
    supportEmail: 'support@petconnect.vn',
    officeAddress: 'Tầng 12, Tòa nhà Innovation, Cầu Giấy, Hà Nội',
    bookingSlotMinutes: '30',
    allowGuestBrowsing: true,
    maintenanceMode: false,
    autoVerifyUsers: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    showAlert({
      title: 'Đã lưu cấu hình',
      message: 'Cài đặt hệ thống nền tảng đã được lưu thành công.',
      type: 'success'
    });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-orange-500" size={24} />
            <span>Cài đặt Nền tảng Hệ thống</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập thông tin thương hiệu, thông số vận hành lịch hẹn và chế độ máy chủ
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <Check size={14} />
            <span>Đã đồng bộ</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Info */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>🐾</span> Thông tin Nền tảng
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Tên hệ thống / Nền tảng</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Hotline CSKH toàn quốc</label>
              <input
                type="text"
                value={settings.supportHotline}
                onChange={(e) => setSettings({ ...settings, supportHotline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Email hỗ trợ khách hàng</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Thời lượng tối thiểu mỗi ca hẹn (phút)</label>
              <select
                value={settings.bookingSlotMinutes}
                onChange={(e) => setSettings({ ...settings, bookingSlotMinutes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white"
              >
                <option value="15">15 phút</option>
                <option value="30">30 phút (Tiêu chuẩn)</option>
                <option value="45">45 phút</option>
                <option value="60">60 phút</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-gray-700 mb-1">Địa chỉ trụ sở chính</label>
            <input
              type="text"
              value={settings.officeAddress}
              onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* System Toggles */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={18} /> Chế độ vận hành
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <p className="font-bold text-gray-900">Cho phép khách vãng lai khám phá dịch vụ & phòng khám</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Người dùng chưa đăng nhập vẫn có thể tra cứu danh sách dịch vụ và phòng khám.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowGuestBrowsing}
                onChange={(e) => setSettings({ ...settings, allowGuestBrowsing: e.target.checked })}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <p className="font-bold text-gray-900">Tự động kích hoạt tài khoản đăng ký mới</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Người dùng đăng ký tài khoản có thể sử dụng ngay mà không cần duyệt thủ công.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoVerifyUsers}
                onChange={(e) => setSettings({ ...settings, autoVerifyUsers: e.target.checked })}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 cursor-pointer">
              <div>
                <p className="font-bold text-rose-900">Bật Chế độ Bảo trì Hệ thống (Maintenance Mode)</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Chỉ quản trị viên mới có thể truy cập, người dùng sẽ thấy thông báo bảo trì.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
