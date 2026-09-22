import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'danger'
    isConfirm: false,
    confirmText: 'Đồng ý',
    cancelText: 'Hủy bỏ',
    onConfirm: null,
    onCancel: null
  });

  const showAlert = useCallback(({ title = 'Thông báo', message = '', type = 'info', confirmText = 'Đóng' } = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: false,
        confirmText,
        cancelText: '',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback(({
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    type = 'warning',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    isDanger = false
  } = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: isDanger ? 'danger' : type,
        isConfirm: true,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const closeModal = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    } else {
      setModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const getTheme = () => {
    switch (modalState.type) {
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          btnConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
        };
      case 'error':
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-rose-50 border-rose-100 text-rose-600',
          btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
        };
      case 'warning':
        return {
          icon: '⚡',
          iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
          btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-50 border-blue-100 text-primary',
          btnConfirm: 'bg-primary hover:bg-opacity-90 text-white shadow-primary/30'
        };
    }
  };

  const theme = getTheme();

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Unified Alert & Confirm Modal */}
      {modalState.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center transform transition-all animate-in zoom-in-95 duration-150 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Circular Icon */}
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4 border ${theme.iconBg} shadow-sm`}>
              {theme.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
              {modalState.title}
            </h3>

            {/* Message Body */}
            <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>

            {/* Action Buttons */}
            <div className={`flex gap-3 ${modalState.isConfirm ? 'justify-between' : 'justify-center'}`}>
              {modalState.isConfirm && (
                <button
                  type="button"
                  onClick={modalState.onCancel}
                  className="flex-1 py-3 px-5 rounded-2xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                >
                  {modalState.cancelText || 'Hủy bỏ'}
                </button>
              )}

              <button
                type="button"
                onClick={modalState.onConfirm}
                className={`py-3 px-6 rounded-2xl font-bold text-sm shadow-lg transition-all ${
                  modalState.isConfirm ? 'flex-1' : 'w-full max-w-xs'
                } ${theme.btnConfirm}`}
              >
                {modalState.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
