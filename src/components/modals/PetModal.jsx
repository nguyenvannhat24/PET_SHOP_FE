import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';

const PetModal = ({ isOpen, onClose, pet, onSave }) => {
  const isEditMode = !!pet;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    gender: 'UNKNOWN',
    date_of_birth: '',
    weight: '',
    color: '',
    avatar_url: '',
    is_neutered: false,
    allergies: '',
    chronic_conditions: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && pet) {
        setFormData({
          name: pet.name || '',
          species: pet.species || '',
          breed: pet.breed || '',
          gender: pet.gender || 'UNKNOWN',
          date_of_birth: pet.date_of_birth ? pet.date_of_birth.substring(0, 10) : '',
          weight: pet.weight || '',
          color: pet.color || '',
          avatar_url: pet.avatar_url || '',
          is_neutered: pet.is_neutered || false,
          allergies: pet.allergies || '',
          chronic_conditions: pet.chronic_conditions || '',
          notes: pet.notes || ''
        });
      } else {
        setFormData({
          name: '',
          species: '',
          breed: '',
          gender: 'UNKNOWN',
          date_of_birth: '',
          weight: '',
          color: '',
          avatar_url: '',
          is_neutered: false,
          allergies: '',
          chronic_conditions: '',
          notes: ''
        });
      }
      setError('');
    }
  }, [isOpen, isEditMode, pet]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await apiClient.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = response.data.data.url;
      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      setError('Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare payload (handle empty numeric fields if necessary)
      const payload = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      if (isEditMode) {
        await apiClient.put(`/pets/${pet._id}`, payload);
      } else {
        await apiClient.post('/pets', payload);
      }
      
      onSave(); // Refresh parent list
      onClose(); // Close modal
    } catch (err) {
      console.error("Lỗi lưu thú cưng:", err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = () => {
    if (formData.avatar_url) {
      if (formData.avatar_url.startsWith('http')) return formData.avatar_url;
      let path = formData.avatar_url.replace(/\\/g, '/');
      if (!path.startsWith('/')) path = '/' + path;
      return `http://localhost:5000${path}`;
    }
    return 'https://via.placeholder.com/150?text=Pet';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Chỉnh sửa Thú cưng' : 'Thêm Thú cưng mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="overflow-y-auto flex-1 p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold text-sm">
              {error}
            </div>
          )}

          <form id="petForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <img 
                  src={getAvatarSrc()} 
                  alt="Pet Avatar" 
                  className="w-28 h-28 rounded-full border-4 border-primary object-cover shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-bold text-white text-xs">Đổi ảnh</span>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <p className="text-sm text-gray-500 mt-2">Ảnh đại diện của bé</p>
            </div>

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tên thú cưng *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Milo" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Loài *</label>
                  <input type="text" name="species" value={formData.species} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Chó, Mèo..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giống</label>
                  <input type="text" name="breed" value={formData.breed} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Poodle, Corgi..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Màu sắc</label>
                  <input type="text" name="color" value={formData.color} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Trắng xám" />
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giới tính</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                    <option value="UNKNOWN">Chưa xác định</option>
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cân nặng (kg)</label>
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: 4.5" />
                </div>
                
                <div className="flex items-center h-[54px] mt-6">
                  <label className="flex items-center cursor-pointer gap-3">
                    <input type="checkbox" name="is_neutered" checked={formData.is_neutered} onChange={handleChange}
                      className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300" />
                    <span className="text-sm font-semibold text-gray-700">Đã triệt sản</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Mở rộng (Ghi chú Y tế) */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ghi chú y tế</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dị ứng</label>
                  <input type="text" name="allergies" value={formData.allergies} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Hải sản..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bệnh mãn tính</label>
                  <input type="text" name="chronic_conditions" value={formData.chronic_conditions} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="VD: Viêm da..." />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú thêm</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ghi chú thêm về bé..."></textarea>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
          <button type="button" onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">
            Hủy
          </button>
          <button type="submit" form="petForm" disabled={loading || uploading}
            className={`px-6 py-2 rounded-xl font-bold text-white bg-primary shadow hover:bg-opacity-90 hover:shadow-lg transition-all ${
              (loading || uploading) ? 'opacity-70 cursor-not-allowed' : ''
            }`}>
            {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm thú cưng')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetModal;
