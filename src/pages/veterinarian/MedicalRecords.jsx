import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, Syringe, Plus, Search, Calendar, User, 
  Clock, CheckCircle, AlertCircle, Phone, Pill, ChevronDown
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';
import getImageUrl from '../../utils/imageUrl';

const VeterinarianMedicalRecords = () => {
  const { showAlert } = useModal();
  const [searchParams] = useSearchParams();
  const initialPetId = searchParams.get('pet_id') || '';

  const [activeTab, setActiveTab] = useState('RECORDS'); // RECORDS or VACCINES
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal Tạo Bệnh án mới
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    pet_id: initialPetId,
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: ''
  });
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Modal Thêm Mũi Tiêm mới
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({
    pet_id: initialPetId,
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    batch_number: '',
    notes: ''
  });
  const [isSavingVaccine, setIsSavingVaccine] = useState(false);

  // Modal xem chi tiết bệnh án
  const [viewingRecord, setViewingRecord] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, vacRes, patRes] = await Promise.all([
        apiClient.get('/medical-records'),
        apiClient.get('/vaccinations'),
        apiClient.get('/pets/veterinarian/my-patients').catch(() => ({ data: { data: [] } }))
      ]);

      setMedicalRecords(recRes.data.data || []);
      setVaccinations(vacRes.data.data || []);
      setPatients(patRes.data.data || []);

      if (initialPetId && !recordForm.pet_id) {
        setRecordForm(prev => ({ ...prev, pet_id: initialPetId }));
        setVaccineForm(prev => ({ ...prev, pet_id: initialPetId }));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bệnh án & tiêm phòng:', error);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý tạo bệnh án mới
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.pet_id) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng chọn thú cưng.', type: 'warning' });
      return;
    }
    if (!recordForm.diagnosis.trim()) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập chẩn đoán.', type: 'warning' });
      return;
    }

    setIsSavingRecord(true);
    try {
      await apiClient.post('/medical-records', recordForm);
      showAlert({ title: 'Thành công', message: 'Đã tạo hồ sơ bệnh án mới!', type: 'success' });
      setIsRecordModalOpen(false);
      setRecordForm({
        pet_id: '',
        diagnosis: '',
        symptoms: '',
        treatment: '',
        prescription: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể tạo bệnh án.',
        type: 'error'
      });
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Xử lý ghi nhận mũi tiêm mới
  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (!vaccineForm.pet_id) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng chọn thú cưng.', type: 'warning' });
      return;
    }
    if (!vaccineForm.vaccine_name.trim()) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tên vaccine.', type: 'warning' });
      return;
    }

    setIsSavingVaccine(true);
    try {
      await apiClient.post('/vaccinations', vaccineForm);
      showAlert({ title: 'Thành công', message: 'Đã ghi nhận mũi tiêm mới!', type: 'success' });
      setIsVaccineModalOpen(false);
      setVaccineForm({
        pet_id: '',
        vaccine_name: '',
        vaccination_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        batch_number: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể ghi nhận mũi tiêm.',
        type: 'error'
      });
    } finally {
      setIsSavingVaccine(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPetImage = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
  };

  // Filter records
  const filteredRecords = medicalRecords.filter(r => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    const petName = (r.pet_id?.name || '').toLowerCase();
    const ownerName = (r.pet_id?.owner_id?.full_name || '').toLowerCase();
    const diag = (r.diagnosis || '').toLowerCase();
    const symp = (r.symptoms || '').toLowerCase();
    return petName.includes(kw) || ownerName.includes(kw) || diag.includes(kw) || symp.includes(kw);
  });

  // Filter vaccines
  const filteredVaccines = vaccinations.filter(v => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    const petName = (v.pet_id?.name || '').toLowerCase();
    const ownerName = (v.pet_id?.owner_id?.full_name || '').toLowerCase();
    const vacName = (v.vaccine_name || '').toLowerCase();
    const batch = (v.batch_number || '').toLowerCase();
    return petName.includes(kw) || ownerName.includes(kw) || vacName.includes(kw) || batch.includes(kw);
  });

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>Hồ sơ Bệnh án & Tiêm chủng</span> 📋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Lưu trữ lịch sử điều trị, phác đồ kê đơn và theo dõi tiêm phòng định kỳ
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'RECORDS' ? (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Lập bệnh án mới
            </button>
          ) : (
            <button
              onClick={() => setIsVaccineModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Ghi nhận mũi tiêm
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECORDS'
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={15} /> Hồ sơ Bệnh án ({medicalRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('VACCINES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VACCINES'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Syringe size={15} /> Sổ Tiêm chủng ({vaccinations.length})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo thú cưng, chủ nuôi, chẩn đoán, thuốc..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Đang tải dữ liệu...</div>
      ) : activeTab === 'RECORDS' ? (
        /* MEDICAL RECORDS TAB */
        filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-bold text-gray-800 text-base">Chưa có hồ sơ bệnh án nào</h3>
            <p className="text-gray-400 text-xs mt-1">Bấm nút "Lập bệnh án mới" để tạo hồ sơ chẩn đoán và đơn thuốc cho thú cưng.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((rec) => (
              <div
                key={rec._id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={getPetImage(rec.pet_id?.image_url)}
                      alt="Pet"
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{rec.pet_id?.name || 'Bé cưng'}</h3>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {rec.pet_id?.species} {rec.pet_id?.breed ? `• ${rec.pet_id.breed}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Chủ nuôi: <span className="font-semibold text-gray-800">{rec.pet_id?.owner_id?.full_name || 'Khách'}</span>
                        {rec.pet_id?.owner_id?.phone && ` • ${rec.pet_id.owner_id.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                      {formatDate(rec.record_date)}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">
                      BS: {rec.veterinarian_id?.name || 'Bác sĩ điều trị'}
                    </p>
                  </div>
                </div>

                {/* Details body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Chẩn đoán bệnh</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{rec.diagnosis}</p>

                    {rec.symptoms && (
                      <p className="text-gray-600 mt-2">
                        <strong className="text-gray-700">Triệu chứng:</strong> {rec.symptoms}
                      </p>
                    )}

                    {rec.treatment && (
                      <p className="text-gray-600 mt-1.5">
                        <strong className="text-gray-700">Phác đồ điều trị:</strong> {rec.treatment}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Đơn thuốc & Liều dùng</p>
                    {rec.prescription ? (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 font-mono mt-1 whitespace-pre-line leading-relaxed">
                        {rec.prescription}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic mt-1">Không có đơn thuốc ngoại trú</p>
                    )}

                    {rec.notes && (
                      <p className="text-amber-800 bg-amber-50/70 p-2 rounded-xl mt-2 italic">
                        Lời dặn: {rec.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VACCINATIONS TAB */
        filteredVaccines.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <div className="text-4xl mb-3">💉</div>
            <h3 className="font-bold text-gray-800 text-base">Chưa có bản ghi tiêm chủng nào</h3>
            <p className="text-gray-400 text-xs mt-1">Bấm nút "Ghi nhận mũi tiêm" để lưu thông tin vaccine và lịch tái chủng cho thú cưng.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVaccines.map((vac) => (
              <div
                key={vac._id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={getPetImage(vac.pet_id?.image_url)}
                        alt="Pet"
                        className="w-12 h-12 rounded-xl object-cover border"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{vac.pet_id?.name || 'Bé cưng'}</h4>
                        <p className="text-xs text-gray-500">
                          Chủ: {vac.pet_id?.owner_id?.full_name} {vac.pet_id?.owner_id?.phone ? `• ${vac.pet_id.owner_id.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Syringe size={18} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Loại Vaccine:</span>
                      <span className="font-bold text-gray-900 text-sm">{vac.vaccine_name}</span>
                    </div>

                    {vac.batch_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Số lô sản xuất:</span>
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {vac.batch_number}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Ngày tiêm:</span>
                      <span className="font-semibold text-gray-800">{formatDate(vac.vaccination_date)}</span>
                    </div>

                    {vac.next_due_date && (
                      <div className="flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                        <span className="text-emerald-800 font-medium">Hẹn tái tiêm:</span>
                        <span className="font-bold text-emerald-800">{formatDate(vac.next_due_date)}</span>
                      </div>
                    )}

                    {vac.notes && (
                      <p className="text-gray-500 italic pt-1">
                        Ghi chú: {vac.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Bác sĩ: {vac.veterinarian_id?.name || 'Bác sĩ thú y'}</span>
                  <span>{vac.clinic_id?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Lập Bệnh án mới */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Lập Hồ sơ Bệnh án mới 📋</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Chọn Bệnh nhân (Thú cưng) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={recordForm.pet_id}
                  onChange={(e) => setRecordForm({ ...recordForm, pet_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-white"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.species} - {p.breed || 'Chưa rõ giống'}) • Chủ: {p.owner_id?.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Chẩn đoán bệnh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Viêm phổi nhẹ, Ký sinh trùng đường ruột..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Triệu chứng lâm sàng
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả dấu hiệu bệnh, kết quả xét nghiệm (nếu có)..."
                  value={recordForm.symptoms}
                  onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phác đồ điều trị
                </label>
                <textarea
                  rows={2}
                  placeholder="Hướng điều trị, chế độ chăm sóc..."
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Đơn thuốc & Liều lượng
                </label>
                <textarea
                  rows={3}
                  placeholder="Tên thuốc, hàm lượng, cách dùng theo ngày..."
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ghi chú / Hẹn tái khám
                </label>
                <input
                  type="text"
                  placeholder="Lời dặn cho gia đình..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecord}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSavingRecord ? 'Đang lưu...' : 'Lưu hồ sơ bệnh án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ghi nhận Mũi tiêm mới */}
      {isVaccineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Ghi nhận Mũi tiêm chủng 💉</h3>
              <button
                onClick={() => setIsVaccineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVaccine} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Chọn Bệnh nhân (Thú cưng) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={vaccineForm.pet_id}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, pet_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium bg-white"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.species} - {p.breed || 'Chưa rõ giống'}) • Chủ: {p.owner_id?.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tên Vaccine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="popular-vaccines"
                  placeholder="Ví dụ: Vaccine dại Rabisin, Vaccine 7 bệnh Vanguard Plus..."
                  value={vaccineForm.vaccine_name}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                />
                <datalist id="popular-vaccines">
                  <option value="Vaccine phòng dại (Rabies)" />
                  <option value="Vaccine 7 bệnh cho Chó (Vanguard Plus 7)" />
                  <option value="Vaccine 5 bệnh cho Chó (Vanguard Plus 5)" />
                  <option value="Vaccine 4 bệnh cho Mèo (PureVax)" />
                  <option value="Vaccine 3 bệnh cho Mèo (Felocell 4)" />
                  <option value="Tẩy giun định kỳ (Drontal / Endogard)" />
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ngày tiêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={vaccineForm.vaccination_date}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, vaccination_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Hẹn tái tiêm (Next due)
                  </label>
                  <input
                    type="date"
                    value={vaccineForm.next_due_date}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, next_due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Số lô vaccine (Batch number)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: LOT-2026B14..."
                  value={vaccineForm.batch_number}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, batch_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ghi chú phản ứng phụ / Hướng dẫn
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Không tắm trong 7 ngày sau tiêm..."
                  value={vaccineForm.notes}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsVaccineModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingVaccine}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSavingVaccine ? 'Đang lưu...' : 'Lưu mũi tiêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianMedicalRecords;
