import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PetModal from '../../components/modals/PetModal';
import PetMedicalRecordModal from '../../components/modals/PetMedicalRecordModal';
import { useModal } from '../../context/ModalContext';
import { Activity, AlertTriangle, Heart, ShieldCheck } from 'lucide-react';
import getImageUrl from '../../utils/imageUrl';

const MyPets = () => {
  const { showAlert, showConfirm } = useModal();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPet, setCurrentPet] = useState(null); // null = Add, object = Edit

  // Modal Bệnh án State
  const [selectedMedicalPet, setSelectedMedicalPet] = useState(null);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/pets');
      setPets(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thú cưng:", err);
      setError("Không thể tải danh sách thú cưng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleAddClick = () => {
    setCurrentPet(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (pet) => {
    setCurrentPet(pet);
    setIsModalOpen(true);
  };

  const handleMedicalClick = (pet) => {
    setSelectedMedicalPet(pet);
  };

  const handleDeleteClick = async (petId, petName) => {
    const confirmed = await showConfirm({
      title: 'Xóa thú cưng?',
      message: `Bạn có chắc chắn muốn xóa bé ${petName} không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa thú cưng',
      cancelText: 'Hủy',
      type: 'danger',
      isDanger: true,
    });

    if (confirmed) {
      try {
        await apiClient.delete(`/pets/${petId}`);
        fetchPets(); // Refresh list after delete
        showAlert({
          title: 'Đã xóa',
          message: `Đã xóa thông tin bé ${petName} thành công.`,
          type: 'success',
        });
      } catch (err) {
        console.error("Lỗi xóa thú cưng:", err);
        showAlert({
          title: 'Lỗi',
          message: err.response?.data?.message || 'Có lỗi xảy ra khi xóa thú cưng.',
          type: 'error',
        });
      }
    }
  };

  const getAvatarSrc = (url) => {
    return getImageUrl(url, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80');
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

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thú cưng của bạn 🐾</h1>
          <p className="text-gray-500 mt-2">Quản lý hồ sơ sức khỏe và sổ bệnh án điện tử cho các bé cưng</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
        >
          <span>+</span> Thêm thú cưng mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pets.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn chưa có thú cưng nào</h2>
          <p className="text-gray-500 mb-6">Hãy thêm thú cưng của bạn để bắt đầu theo dõi sức khỏe và lịch hẹn.</p>
          <button onClick={handleAddClick} className="text-primary font-bold hover:underline">
            Thêm thú cưng ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet._id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="p-6 flex gap-4 items-start relative">
                  <img 
                    src={getAvatarSrc(pet.avatar_url || pet.image_url)} 
                    alt={pet.name} 
                    className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-gray-100 shrink-0" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{pet.name}</h3>
                    <div className="text-sm text-gray-500 mt-1 flex flex-col gap-0.5">
                      <span><span className="font-semibold text-gray-700">Loài:</span> {pet.species}</span>
                      <span className="truncate"><span className="font-semibold text-gray-700">Giống:</span> {pet.breed || 'Chưa rõ'}</span>
                      <span><span className="font-semibold text-gray-700">Tuổi:</span> {calculateAge(pet.date_of_birth)}</span>
                    </div>

                    {pet.weight && (
                      <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        ⚖️ {pet.weight} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Health tags */}
                {(pet.allergies || pet.chronic_conditions) && (
                  <div className="px-6 pb-3 flex flex-wrap gap-1.5 text-[11px]">
                    {pet.allergies && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <AlertTriangle size={10} /> Dị ứng: {pet.allergies}
                      </span>
                    )}
                    {pet.chronic_conditions && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <Heart size={10} /> Mãn tính: {pet.chronic_conditions}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex gap-2 justify-end mt-auto">
                <button 
                  onClick={() => handleMedicalClick(pet)}
                  className="px-4 py-2.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl shadow-xs hover:bg-teal-100 transition-colors flex-1 flex items-center justify-center gap-1.5"
                >
                  <Activity size={14} className="text-teal-600" /> Sổ Bệnh án
                </button>
                <button 
                  onClick={() => handleEditClick(pet)}
                  className="px-3.5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-100 transition-colors"
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDeleteClick(pet._id, pet.name)}
                  className="px-3.5 py-2.5 text-xs font-bold text-red-600 bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-red-50 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa thông tin thú cưng */}
      <PetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        pet={currentPet} 
        onSave={fetchPets}
      />

      {/* Modal Xem Sổ Bệnh án & Tiêm chủng của bé */}
      <PetMedicalRecordModal
        isOpen={!!selectedMedicalPet}
        onClose={() => setSelectedMedicalPet(null)}
        pet={selectedMedicalPet}
      />
    </div>
  );
};

export default MyPets;
