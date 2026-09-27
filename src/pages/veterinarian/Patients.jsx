import React, { useState, useEffect } from 'react';
import { 
  User, Search, Phone, Mail, MapPin, Calendar, 
  FileText, Syringe, Heart, Award, ChevronRight, X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useModal } from '../../context/ModalContext';
import getImageUrl from '../../utils/imageUrl';

const VeterinarianPatients = () => {
  const { showAlert } = useModal();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');

  // Modal xem lịch sử bệnh án của bé
  const [activeHistoryPet, setActiveHistoryPet] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Modal xem sổ tiêm chủng của bé
  const [activeVaccinePet, setActiveVaccinePet] = useState(null);
  const [vaccineRecords, setVaccineRecords] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pets/veterinarian/my-patients');
      setPatients(res.data.data || []);
    } catch (error) {
      console.error('Lỗi tải danh sách bệnh nhân:', error);
      showAlert({
        title: 'Lỗi',
        message: 'Không thể tải danh sách bệnh nhân. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Mở modal xem bệnh án của một bé
  const handleOpenMedicalHistory = async (pet) => {
    setActiveHistoryPet(pet);
    setLoadingRecords(true);
    try {
      const res = await apiClient.get(`/medical-records/pet/${pet._id}`);
      setMedicalRecords(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải bệnh án bé:', err);
      setMedicalRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Mở modal xem sổ tiêm của một bé
  const handleOpenVaccines = async (pet) => {
    setActiveVaccinePet(pet);
    setLoadingVaccines(true);
    try {
      const res = await apiClient.get(`/vaccinations/pet/${pet._id}`);
      setVaccineRecords(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải sổ tiêm bé:', err);
      setVaccineRecords([]);
    } finally {
      setLoadingVaccines(false);
    }
  };

  const getPetImage = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredPatients = patients.filter((pet) => {
    if (speciesFilter !== 'ALL') {
      const sp = (pet.species || '').toLowerCase();
      if (speciesFilter === 'DOG' && !sp.includes('chó') && !sp.includes('dog')) return false;
      if (speciesFilter === 'CAT' && !sp.includes('mèo') && !sp.includes('cat')) return false;
      if (speciesFilter === 'OTHER' && (sp.includes('chó') || sp.includes('dog') || sp.includes('mèo') || sp.includes('cat'))) return false;
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const petName = (pet.name || '').toLowerCase();
      const breed = (pet.breed || '').toLowerCase();
      const ownerName = (pet.owner_id?.full_name || '').toLowerCase();
      const phone = (pet.owner_id?.phone || '').toLowerCase();
      return petName.includes(kw) || breed.includes(kw) || ownerName.includes(kw) || phone.includes(kw);
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>Danh sách Bệnh nhân</span> 🐾
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tổng hợp các thú cưng đã và đang được theo dõi, điều trị bởi bạn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-xs font-semibold text-gray-700">
            Tổng cộng: <span className="text-primary font-bold text-sm">{patients.length}</span> bệnh nhân
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'DOG', label: '🐶 Chó' },
            { id: 'CAT', label: '🐱 Mèo' },
            { id: 'OTHER', label: '🐾 Khác' }
          ].map((sp) => (
            <button
              key={sp.id}
              onClick={() => setSpeciesFilter(sp.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                speciesFilter === sp.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, giống, chủ nuôi, SĐT..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Đang tải danh sách bệnh nhân...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="text-4xl mb-3">🐶</div>
          <h3 className="font-bold text-gray-800 text-base">Không tìm thấy bệnh nhân nào</h3>
          <p className="text-gray-400 text-xs mt-1">Khi bạn tiếp nhận ca khám hoặc lập hồ sơ, bệnh nhân sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((pet) => (
            <div
              key={pet._id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Pet Header */}
                <div className="flex items-start gap-3.5 mb-4">
                  <img
                    src={getPetImage(pet.image_url)}
                    alt={pet.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-base truncate">{pet.name}</h3>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {pet.species || 'Thú cưng'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Giống: <span className="font-medium text-gray-700">{pet.breed || 'Chưa rõ'}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      {pet.age ? <span>{pet.age} tuổi</span> : null}
                      {pet.gender ? <span>• {pet.gender}</span> : null}
                      {pet.weight ? <span>• {pet.weight} kg</span> : null}
                    </div>
                  </div>
                </div>

                {/* Owner Information Box */}
                <div className="bg-slate-50/80 rounded-xl p-3 text-xs space-y-1.5 mb-4 border border-slate-100">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <User size={13} className="text-gray-400" />
                    <span>{pet.owner_id?.full_name || 'Khách hàng'}</span>
                  </div>
                  {pet.owner_id?.phone && (
                    <div className="flex items-center gap-1.5 text-teal-700">
                      <Phone size={13} />
                      <a href={`tel:${pet.owner_id.phone}`} className="hover:underline font-medium">
                        {pet.owner_id.phone}
                      </a>
                    </div>
                  )}
                  {pet.owner_id?.email && (
                    <div className="flex items-center gap-1.5 text-gray-500 truncate">
                      <Mail size={13} />
                      <span className="truncate">{pet.owner_id.email}</span>
                    </div>
                  )}
                </div>

                {/* Visit summary */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
                  <span>Lần khám gần nhất:</span>
                  <span className="font-semibold text-gray-800">{formatDate(pet.last_visit)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenMedicalHistory(pet)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors"
                >
                  <FileText size={13} /> Lịch sử bệnh
                </button>
                <button
                  onClick={() => handleOpenVaccines(pet)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors"
                >
                  <Syringe size={13} /> Sổ tiêm chủng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lịch sử Bệnh án */}
      {activeHistoryPet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getPetImage(activeHistoryPet.image_url)}
                  alt="Pet"
                  className="w-12 h-12 rounded-2xl object-cover border"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Hồ sơ bệnh án của bé {activeHistoryPet.name} 📋
                  </h3>
                  <p className="text-xs text-gray-500">
                    Chủ nuôi: {activeHistoryPet.owner_id?.full_name} • SĐT: {activeHistoryPet.owner_id?.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveHistoryPet(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingRecords ? (
                <div className="py-12 text-center text-gray-400">Đang tải hồ sơ bệnh án...</div>
              ) : medicalRecords.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  Bé chưa có hồ sơ bệnh án nào trước đây.
                </div>
              ) : (
                medicalRecords.map((rec) => (
                  <div key={rec._id} className="p-4 rounded-2xl border border-gray-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-800 text-sm">{rec.diagnosis}</span>
                      <span className="text-xs text-gray-400 font-medium">{formatDate(rec.record_date)}</span>
                    </div>

                    {rec.symptoms && (
                      <p className="text-xs text-gray-600">
                        <strong className="text-gray-700">Triệu chứng:</strong> {rec.symptoms}
                      </p>
                    )}

                    {rec.treatment && (
                      <p className="text-xs text-gray-600">
                        <strong className="text-gray-700">Điều trị:</strong> {rec.treatment}
                      </p>
                    )}

                    {rec.prescription && (
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs font-mono text-gray-800">
                        <p className="font-bold text-gray-600 font-sans mb-0.5">Đơn thuốc:</p>
                        <p className="whitespace-pre-line">{rec.prescription}</p>
                      </div>
                    )}

                    {rec.notes && (
                      <p className="text-xs text-amber-700 italic">
                        Lời dặn: {rec.notes}
                      </p>
                    )}

                    <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-100">
                      <span>Bác sĩ: {rec.veterinarian_id?.name || 'Bác sĩ thú y'}</span>
                      <span>{rec.clinic_id?.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setActiveHistoryPet(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sổ Tiêm Chủng */}
      {activeVaccinePet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getPetImage(activeVaccinePet.image_url)}
                  alt="Pet"
                  className="w-12 h-12 rounded-2xl object-cover border"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Sổ tiêm chủng của bé {activeVaccinePet.name} 💉
                  </h3>
                  <p className="text-xs text-gray-500">
                    Chủ nuôi: {activeVaccinePet.owner_id?.full_name} • SĐT: {activeVaccinePet.owner_id?.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVaccinePet(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {loadingVaccines ? (
                <div className="py-12 text-center text-gray-400">Đang tải lịch sử tiêm...</div>
              ) : vaccineRecords.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  Bé chưa có mũi tiêm chủng nào được ghi nhận.
                </div>
              ) : (
                vaccineRecords.map((vac) => (
                  <div key={vac._id} className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/50 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>{vac.vaccine_name}</span>
                        {vac.batch_number && (
                          <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                            Lô: {vac.batch_number}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Ngày tiêm: <span className="font-semibold text-gray-800">{formatDate(vac.vaccination_date)}</span>
                      </p>
                      {vac.next_due_date && (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Hẹn mũi tiếp theo: {formatDate(vac.next_due_date)}
                        </p>
                      )}
                      {vac.notes && <p className="text-xs text-gray-500 mt-1 italic">Ghi chú: {vac.notes}</p>}
                    </div>

                    <div className="text-right text-[11px] text-gray-400">
                      <p>{vac.veterinarian_id?.name || 'Bác sĩ thú y'}</p>
                      <p>{vac.clinic_id?.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setActiveVaccinePet(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
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

export default VeterinarianPatients;
