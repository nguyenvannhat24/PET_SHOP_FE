import React, { useState, useEffect } from 'react';
import { 
  FileText, Syringe, Calendar, User, Clock, AlertTriangle, 
  CheckCircle, Copy, Check, Stethoscope, Phone, MapPin, 
  Sparkles, ShieldCheck, Heart, Info, Pill, Plus, X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import getImageUrl from '../../utils/imageUrl';

const PetMedicalRecordModal = ({ isOpen, onClose, pet }) => {
  const [activeTab, setActiveTab] = useState('RECORDS'); // RECORDS, VACCINES, PROFILE
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Form Thêm Mũi tiêm cho chủ nuôi
  const [isAddingVaccine, setIsAddingVaccine] = useState(false);
  const [isSubmittingVaccine, setIsSubmittingVaccine] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    batch_number: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && pet?._id) {
      fetchPetHealthData();
    }
  }, [isOpen, pet?._id]);

  const fetchPetHealthData = async () => {
    setLoading(true);
    try {
      const [recRes, vacRes] = await Promise.all([
        apiClient.get(`/medical-records/pet/${pet._id}`),
        apiClient.get(`/vaccinations/pet/${pet._id}`)
      ]);

      setMedicalRecords(recRes.data.data || []);
      setVaccinations(vacRes.data.data || []);
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ bệnh án của bé:', error);
      setMedicalRecords([]);
      setVaccinations([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pet) return null;

  const getAvatarSrc = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
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

  const handleSaveVaccine = async (e) => {
    e.preventDefault();
    if (!vaccineForm.vaccine_name.trim()) return;

    setIsSubmittingVaccine(true);
    try {
      await apiClient.post('/vaccinations', {
        pet_id: pet._id,
        ...vaccineForm
      });
      setIsAddingVaccine(false);
      setVaccineForm({
        vaccine_name: '',
        vaccination_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        batch_number: '',
        notes: ''
      });
      fetchPetHealthData();
    } catch (err) {
      console.error('Lỗi lưu mũi tiêm:', err);
      alert(err.response?.data?.message || 'Không thể lưu mũi tiêm.');
    } finally {
      setIsSubmittingVaccine(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Modal Top Banner & Pet Profile Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={getAvatarSrc(pet.avatar_url)}
              alt={pet.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{pet.name}</h2>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                  {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
                </span>
              </div>

              <p className="text-teal-100 text-xs mt-1">
                {calculateAge(pet.date_of_birth)}
                {pet.gender && pet.gender !== 'UNKNOWN' ? ` • ${pet.gender === 'MALE' ? 'Đực ♂' : 'Cái ♀'}` : ''}
                {pet.weight ? ` • ${pet.weight} kg` : ''}
                {pet.is_neutered ? ' • Đã triệt sản' : ''}
              </p>

              {/* Warning badges for allergies / chronic condition */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2.5">
                {pet.allergies && (
                  <span className="text-[11px] bg-rose-500/80 text-white font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                    <AlertTriangle size={11} /> Dị ứng: {pet.allergies}
                  </span>
                )}
                {pet.chronic_conditions && (
                  <span className="text-[11px] bg-amber-500/80 text-white font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                    <Heart size={11} /> Bệnh mãn tính: {pet.chronic_conditions}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-gray-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECORDS'
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={15} />
            <span>Hồ sơ Bệnh án ({medicalRecords.length})</span>
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
            <span>Sổ Tiêm chủng ({vaccinations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Info size={15} />
            <span>Thể trạng & Dị ứng</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs">Đang tải hồ sơ bệnh án của bé...</p>
            </div>
          ) : activeTab === 'RECORDS' ? (
            /* TAB 1: MEDICAL RECORDS */
            medicalRecords.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl bg-slate-50/50">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-bold text-gray-800 text-base">Bé chưa có hồ sơ bệnh án nào</h3>
                <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                  Khi bạn đưa bé đi khám tại các phòng khám đối tác, bác sĩ phụ trách sẽ cập nhật chẩn đoán và đơn thuốc trực tiếp vào đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((rec) => (
                  <div
                    key={rec._id}
                    className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow space-y-3.5"
                  >
                    {/* Header of Record */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Chẩn đoán</span>
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            {formatDate(rec.record_date)}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-base mt-0.5">{rec.diagnosis}</h4>
                      </div>

                      <div className="text-left sm:text-right text-xs text-gray-500">
                        <p className="font-bold text-gray-800 flex items-center sm:justify-end gap-1">
                          <Stethoscope size={13} className="text-primary" />
                          {rec.veterinarian_id?.name ? `BS. ${rec.veterinarian_id.name}` : 'Bác sĩ thú y'}
                        </p>
                        {rec.clinic_id && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {rec.clinic_id.name} {rec.clinic_id.phone ? `• ${rec.clinic_id.phone}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Symptoms & Treatment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

                    {/* Prescription Box */}
                    {rec.prescription && (
                      <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl relative">
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
                                <Check size={11} className="text-emerald-600" /> Đã chép
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

                    {/* Notes & Advice */}
                    {rec.notes && (
                      <p className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 italic">
                        <strong>Lời dặn của bác sĩ:</strong> {rec.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'VACCINES' ? (
            /* TAB 2: VACCINATION BOOK */
            <div className="space-y-4">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Sổ tiêm phòng định kỳ</h4>
                  <p className="text-[11px] text-gray-400">Ghi lại mũi tiêm do bác sĩ hoặc bạn tự theo dõi cho bé</p>
                </div>

                <button
                  onClick={() => setIsAddingVaccine(!isAddingVaccine)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isAddingVaccine ? <X size={13} /> : <Plus size={13} />}
                  <span>{isAddingVaccine ? 'Đóng form' : 'Ghi nhận mũi tiêm'}</span>
                </button>
              </div>

              {/* Form Ghi nhận mũi tiêm */}
              {isAddingVaccine && (
                <form onSubmit={handleSaveVaccine} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Syringe size={13} className="text-blue-600" /> Thêm mũi tiêm mới cho {pet.name}
                  </h5>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tên Vaccine <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="owner-vaccine-options"
                      placeholder="Ví dụ: Vaccine dại Rabies, Vaccine 7 bệnh cho Chó, PureVax 4 bệnh Mèo..."
                      value={vaccineForm.vaccine_name}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                    />
                    <datalist id="owner-vaccine-options">
                      <option value="Vaccine phòng dại (Rabies)" />
                      <option value="Vaccine 7 bệnh cho Chó (Vanguard Plus 7)" />
                      <option value="Vaccine 5 bệnh cho Chó" />
                      <option value="Vaccine 4 bệnh cho Mèo (PureVax)" />
                      <option value="Vaccine 3 bệnh cho Mèo (Felocell)" />
                      <option value="Tẩy giun sán định kỳ" />
                      <option value="Nhỏ gáy trị ve rận (Frontline / Bravecto)" />
                    </datalist>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ngày tiêm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={vaccineForm.vaccination_date}
                        onChange={(e) => setVaccineForm({ ...vaccineForm, vaccination_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Hẹn tái tiêm (Nhắc tiêm mũi kế tiếp)
                      </label>
                      <input
                        type="date"
                        value={vaccineForm.next_due_date}
                        onChange={(e) => setVaccineForm({ ...vaccineForm, next_due_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Số lô / Nơi tiêm
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: LOT-2026 / Tiêm tại trạm thú y phường..."
                        value={vaccineForm.batch_number}
                        onChange={(e) => setVaccineForm({ ...vaccineForm, batch_number: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ghi chú sau tiêm
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Sốt nhẹ 1 ngày, kiêng tắm 7 ngày..."
                        value={vaccineForm.notes}
                        onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingVaccine(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingVaccine}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      {isSubmittingVaccine ? 'Đang lưu...' : 'Lưu vào sổ tiêm'}
                    </button>
                  </div>
                </form>
              )}

              {/* List of Vaccines */}
              {vaccinations.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-gray-200 rounded-3xl bg-slate-50/50">
                  <div className="text-4xl mb-3">💉</div>
                  <h3 className="font-bold text-gray-800 text-base">Chưa có bản ghi tiêm chủng nào</h3>
                  <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                    Bạn có thể bấm nút <strong>"Ghi nhận mũi tiêm"</strong> ở trên để tự lưu lại các mũi tiêm của bé, hoặc đợi bác sĩ cập nhật khi đi khám.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                {vaccinations.map((vac) => {
                  const status = getVaccineStatus(vac.next_due_date);
                  return (
                    <div
                      key={vac._id}
                      className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                            <Syringe size={16} className="text-blue-600" />
                            {vac.vaccine_name}
                          </h4>
                          {vac.batch_number && (
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              Lô: {vac.batch_number}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Ngày tiêm: <strong className="text-gray-800">{formatDate(vac.vaccination_date)}</strong>
                          </span>
                          {vac.next_due_date && (
                            <span>
                              Hẹn tái tiêm: <strong className="text-emerald-700">{formatDate(vac.next_due_date)}</strong>
                            </span>
                          )}
                        </div>

                        {vac.notes && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Lưu ý: {vac.notes}
                          </p>
                        )}
                      </div>

                      {/* Status Tag & Doctor */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {status && (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">
                          {vac.veterinarian_id?.name ? `BS. ${vac.veterinarian_id.name}` : ''}
                          {vac.clinic_id ? ` • ${vac.clinic_id.name}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
            /* TAB 3: HEALTH SUMMARY & ALLERGIES */
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 text-xs">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={16} /> Thông số thể trạng bé
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-gray-400">Cân nặng hiện tại</span>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      {pet.weight ? `${pet.weight} kg` : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-gray-400">Tình trạng triệt sản</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {pet.is_neutered ? '✓ Đã triệt sản' : 'Chưa triệt sản'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-gray-400">Màu lông</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{pet.color || 'Chưa rõ'}</p>
                  </div>
                </div>
              </div>

              {/* Allergy Warning Box */}
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={14} className="text-rose-600" /> Tiền sử dị ứng thức ăn / thuốc
                </p>
                <p className="text-rose-800 text-sm font-medium">
                  {pet.allergies || 'Không có ghi nhận dị ứng nào.'}
                </p>
              </div>

              {/* Chronic Conditions Box */}
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Heart size={14} className="text-amber-600" /> Bệnh lý nền / Mãn tính cần chú ý
                </p>
                <p className="text-amber-800 text-sm font-medium">
                  {pet.chronic_conditions || 'Không có ghi nhận bệnh mãn tính.'}
                </p>
              </div>

              {/* Special Owner Notes */}
              {pet.notes && (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Ghi chú chăm sóc đặc biệt
                  </p>
                  <p className="text-gray-600">{pet.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Hồ sơ sức khỏe điện tử đồng bộ trực tiếp với Bác sĩ thú y</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetMedicalRecordModal;
