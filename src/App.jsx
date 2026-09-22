import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ModalProvider>
      <div className="min-h-screen bg-background font-sans">
        <AppRoutes />
      </div>
    </ModalProvider>
  );
}

export default App;
