import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileText, Syringe, Calendar, User, Clock, AlertTriangle, 
  CheckCircle, Copy, Check, Stethoscope, Phone, Search, 
  Filter, Pill, Heart, AlertCircle, Sparkles, Plus, X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';

const OwnerMedicalRecords = () => {
  const { showAlert } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramPetId = searchParams.get('pet_id') || 'ALL';

  const [activeTab, setActiveTab] = useState('RECORDS'); // RECORDS or VACCINES
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(paramPetId);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal Ghi nhận Mũi Tiêm của chủ nuôi
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isSavingVaccine, setIsSavingVaccine] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({
    pet_id: '',
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    batch_number: '',
    notes: ''
  });

  // Tải danh sách thú cưng và dữ liệu sức khỏe
  const fetchData = async () => {
    setLoading(true);
    try {
      const [petsRes, recsRes, vacsRes] = await Promise.all([
        apiClient.get('/pets'),
        apiClient.get('/medical-records'),
        apiClient.get('/vaccinations')
      ]);

      const petsList = petsRes.data.data || [];
      setPets(petsList);
      setMedicalRecords(recsRes.data.data || []);
      setVaccinations(vacsRes.data.data || []);

      if (paramPetId && paramPetId !== 'ALL') {
        setSelectedPetId(paramPetId);
      }
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ y tế:', error);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải hồ sơ y tế. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPet = (petId) => {
    setSelectedPetId(petId);
    if (petId === 'ALL') {
      searchParams.delete('pet_id');
    } else {
      searchParams.set('pet_id', petId);
    }
    setSearchParams(searchParams);
  };

  const getAvatarSrc = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80';
    if (url.startsWith('http')) return url;
    let path = url.replace(/\\/g, '/');
    if (!path.startsWith('/')) path = '/' + path;
    return `http://localhost:5000${path}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getVaccineStatus = (nextDueDate) => {
    if (!nextDueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Quá hạn ${Math.abs(diffDays)} ngày`,
        color: 'bg-rose-100 text-rose-700 border-rose-200'
      };
    } else if (diffDays <= 14) {
      return {
        label: `Sắp đến hạn (${diffDays} ngày tới)`,
        color: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
      };
    } else {
      return {
        label: `Đến hạn: ${formatDate(nextDueDate)}`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
  };

  const handleCopyPrescription = (prescriptionText, recordId) => {
    if (!prescriptionText) return;
    navigator.clipboard.writeText(prescriptionText);
    setCopiedId(recordId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter records by selectedPetId and searchKeyword
  const filteredRecords = medicalRecords.filter((rec) => {
    if (selectedPetId !== 'ALL') {
      const petId = rec.pet_id?._id || rec.pet_id;
      if (petId?.toString() !== selectedPetId.toString()) return false;
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const petName = (rec.pet_id?.name || '').toLowerCase();
      const diag = (rec.diagnosis || '').toLowerCase();
      const symp = (rec.symptoms || '').toLowerCase();
      const med = (rec.prescription || '').toLowerCase();
      const vet = (rec.veterinarian_id?.name || '').toLowerCase();
      const clinic = (rec.clinic_id?.name || '').toLowerCase();
      return petName.includes(kw) || diag.includes(kw) || symp.includes(kw) || med.includes(kw) || vet.includes(kw) || clinic.includes(kw);
    }

    return true;
  });

  // Filter vaccines by selectedPetId and searchKeyword
  const filteredVaccines = vaccinations.filter((vac) => {
    if (selectedPetId !== 'ALL') {
      const petId = vac.pet_id?._id || vac.pet_id;
      if (petId?.toString() !== selectedPetId.toString()) return false;
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const petName = (vac.pet_id?.name || '').toLowerCase();
      const vacName = (vac.vaccine_name || '').toLowerCase();
      const batch = (vac.batch_number || '').toLowerCase();
      const clinic = (vac.clinic_id?.name || '').toLowerCase();
      return petName.includes(kw) || vacName.includes(kw) || batch.includes(kw) || clinic.includes(kw);
    }

    return true;
  });

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
      showAlert({ title: 'Thành công', message: 'Đã ghi nhận mũi tiêm thành công!', type: 'success' });
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

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>Sổ Bệnh án & Tiêm chủng Điện tử</span> 🩺
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi chi tiết lịch sử khám chữa bệnh, đơn thuốc và lịch tiêm phòng định kỳ của các bé
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVaccineForm(prev => ({
                ...prev,
                pet_id: selectedPetId !== 'ALL' ? selectedPetId : (pets.length > 0 ? pets[0]._id : '')
              }));
              setIsVaccineModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Ghi nhận mũi tiêm
          </button>
          <Link
            to="/owner/pets"
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 shadow-2xs transition-colors"
          >
            Quản lý thú cưng 🐾
          </Link>
        </div>
      </div>

      {/* Pet Selection Pill Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => handleSelectPet('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPetId === 'ALL'
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-gray-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            🐾 Tất cả thú cưng ({pets.length})
          </button>

          {pets.map((pet) => (
            <button
              key={pet._id}
              onClick={() => handleSelectPet(pet._id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedPetId === pet._id
                  ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-200'
                  : 'text-gray-700 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <img
                src={getAvatarSrc(pet.avatar_url)}
                alt={pet.name}
                className="w-5 h-5 rounded-full object-cover border border-white"
              />
              <span>{pet.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECORDS'
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={15} />
            <span>Hồ sơ Bệnh án ({filteredRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('VACCINES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VACCINES'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Syringe size={15} />
            <span>Sổ Tiêm chủng ({filteredVaccines.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo chẩn đoán, thuốc, bác sĩ, vaccine..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-gray-400">
          Đang tải hồ sơ bệnh án & tiêm chủng...
        </div>
      ) : activeTab === 'RECORDS' ? (
        /* TAB 1: MEDICAL RECORDS */
        filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-bold text-gray-800 text-base">Chưa có hồ sơ bệnh án nào</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              Khi bé đi khám tại các phòng khám đối tác, bác sĩ sẽ ghi nhận chẩn đoán và đơn thuốc trực tiếp vào hồ sơ điện tử này.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((rec) => (
              <div
                key={rec._id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={getAvatarSrc(rec.pet_id?.avatar_url || rec.pet_id?.image_url)}
                      alt={rec.pet_id?.name || 'Pet'}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{rec.pet_id?.name || 'Thú cưng'}</h3>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                          {rec.pet_id?.species} {rec.pet_id?.breed ? `• ${rec.pet_id.breed}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ngày khám: <span className="font-semibold text-gray-700">{formatDate(rec.record_date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-gray-800 text-xs flex items-center sm:justify-end gap-1">
                      <Stethoscope size={13} className="text-primary" />
                      {rec.veterinarian_id?.name ? `BS. ${rec.veterinarian_id.name}` : 'Bác sĩ thú y'}
                    </p>
                    {rec.clinic_id && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {rec.clinic_id.name}
                        {rec.clinic_id.phone && (
                          <a href={`tel:${rec.clinic_id.phone}`} className="ml-1 text-teal-600 hover:underline">
                            ({rec.clinic_id.phone})
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Diagnosis & Symptoms */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chẩn đoán:</span>
                    <span className="font-extrabold text-teal-800 text-base">{rec.diagnosis}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                    {rec.symptoms && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="font-bold text-gray-700 mb-0.5">Triệu chứng lâm sàng:</p>
                        <p className="text-gray-600">{rec.symptoms}</p>
                      </div>
                    )}
                    {rec.treatment && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="font-bold text-gray-700 mb-0.5">Phương pháp điều trị:</p>
                        <p className="text-gray-600">{rec.treatment}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescription */}
                {rec.prescription && (
                  <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill size={14} className="text-teal-700" /> Toa thuốc & Hướng dẫn sử dụng
                      </span>
                      <button
                        onClick={() => handleCopyPrescription(rec.prescription, rec._id)}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs flex items-center gap-1 transition-colors"
                      >
                        {copiedId === rec._id ? (
                          <>
                            <Check size={11} className="text-emerald-600" /> Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Sao chép đơn thuốc
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-teal-950 whitespace-pre-line leading-relaxed">
                      {rec.prescription}
                    </p>
                  </div>
                )}

                {/* Doctor's Advice */}
                {rec.notes && (
                  <p className="text-xs text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-100 italic">
                    <strong>Lời dặn của bác sĩ:</strong> {rec.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 2: VACCINATIONS */
        filteredVaccines.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
            <div className="text-4xl mb-3">💉</div>
            <h3 className="font-bold text-gray-800 text-base">Chưa có bản ghi tiêm chủng nào</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              Thông tin các mũi tiêm phòng và lịch nhắc tái chủng sẽ tự động hiển thị sau khi bé tiêm tại phòng khám.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVaccines.map((vac) => {
              const status = getVaccineStatus(vac.next_due_date);
              return (
                <div
                  key={vac._id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarSrc(vac.pet_id?.avatar_url || vac.pet_id?.image_url)}
                          alt={vac.pet_id?.name || 'Pet'}
                          className="w-12 h-12 rounded-2xl object-cover border"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{vac.pet_id?.name || 'Bé cưng'}</h4>
                          <p className="text-xs text-gray-400">
                            {vac.pet_id?.species} {vac.pet_id?.breed ? `• ${vac.pet_id.breed}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Syringe size={18} />
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tên Vaccine:</span>
                        <span className="font-bold text-gray-900 text-sm">{vac.vaccine_name}</span>
                      </div>

                      {vac.batch_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Số lô:</span>
                          <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {vac.batch_number}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Ngày tiêm:</span>
                        <span className="font-semibold text-gray-800">{formatDate(vac.vaccination_date)}</span>
                      </div>

                      {vac.next_due_date && (
                        <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                          <span className="text-emerald-800 font-medium">Hẹn tái tiêm:</span>
                          <span className="font-bold text-emerald-800">{formatDate(vac.next_due_date)}</span>
                        </div>
                      )}

                      {vac.notes && (
                        <p className="text-gray-500 italic pt-1">
                          Lưu ý: {vac.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    {status ? (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    ) : <span></span>}

                    <span className="text-[11px] text-gray-400">
                      {vac.clinic_id?.name || 'Phòng khám thú y'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Ghi nhận Mũi tiêm mới cho chủ nuôi */}
      {isVaccineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Syringe size={20} className="text-blue-600" />
                <span>Ghi nhận Mũi tiêm chủng 💉</span>
              </h3>
              <button
                onClick={() => setIsVaccineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVaccine} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Chọn Thú cưng <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={vaccineForm.pet_id}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, pet_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium bg-white"
                >
                  <option value="">-- Chọn thú cưng --</option>
                  {pets.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.species} - {p.breed || 'Chưa rõ giống'})
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
                  list="owner-page-vaccines"
                  placeholder="Ví dụ: Vaccine dại Rabisin, Vaccine 7 bệnh cho Chó, PureVax 4 bệnh Mèo..."
                  value={vaccineForm.vaccine_name}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                />
                <datalist id="owner-page-vaccines">
                  <option value="Vaccine phòng dại (Rabies)" />
                  <option value="Vaccine 7 bệnh cho Chó (Vanguard Plus 7)" />
                  <option value="Vaccine 5 bệnh cho Chó (Vanguard Plus 5)" />
                  <option value="Vaccine 4 bệnh cho Mèo (PureVax)" />
                  <option value="Vaccine 3 bệnh cho Mèo (Felocell 4)" />
                  <option value="Tẩy giun sán định kỳ (Drontal / Endogard)" />
                  <option value="Nhỏ gáy trị ve rận (Frontline / Bravecto)" />
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
                  Số lô / Địa điểm tiêm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: LOT-2026 / Trạm thú y phường..."
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
                  placeholder="Ví dụ: Kiêng tắm 7 ngày, theo dõi sốt..."
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
                  {isSavingVaccine ? 'Đang lưu...' : 'Lưu vào sổ tiêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMedicalRecords;
