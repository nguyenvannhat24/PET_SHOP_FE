import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import ClinicLayout from '../layouts/ClinicLayout';
import VeterinarianLayout from '../layouts/VeterinarianLayout';
import AdminLayout from '../layouts/AdminLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RoleRoute from './RoleRoute';
import Home from '../pages/public/Home';
import Clinics from '../pages/public/Clinics';
import Services from '../pages/public/Services';
import OwnerDashboard from '../pages/owner/Dashboard';
import Profile from '../pages/owner/Profile';
import MyPets from '../pages/owner/MyPets';
import MyAppointments from '../pages/owner/MyAppointments';
import OwnerMedicalRecords from '../pages/owner/MedicalRecords';
import ClinicDashboard from '../pages/clinic/Dashboard';
import ClinicAppointments from '../pages/clinic/Appointments';
import ClinicServices from '../pages/clinic/Services';
import ClinicProfile from '../pages/clinic/Profile';
import ClinicVeterinarians from '../pages/clinic/Veterinarians';
import ClinicCustomers from '../pages/clinic/Customers';
import VetDashboard from '../pages/veterinarian/Dashboard';
import VetSchedule from '../pages/veterinarian/Schedule';
import VetPatients from '../pages/veterinarian/Patients';
import VetMedicalRecords from '../pages/veterinarian/MedicalRecords';
import VetProfile from '../pages/veterinarian/Profile';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminClinics from '../pages/admin/Clinics';
import AdminAppointments from '../pages/admin/Appointments';
import AdminSettings from '../pages/admin/Settings';
import Chat from '../pages/chat/Chat';

// Placeholder Pages
const NotFound = () => <div className="p-8"><h1 className="text-2xl font-bold text-danger">404 - Not Found</h1></div>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="clinics" element={<Clinics />} />
        <Route path="services" element={<Services />} />
        <Route path="chat" element={<Chat />} />
        {/* Add more public routes here */}
      </Route>

      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* Owner Routes */}
      <Route path="/owner" element={<RoleRoute allowedRoles={['PET_OWNER', 'ADMIN']}><OwnerLayout /></RoleRoute>}>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="pets" element={<MyPets />} />
        <Route path="records" element={<OwnerMedicalRecords />} />
        <Route path="appointments" element={<MyAppointments />} />
      </Route>

      {/* Clinic Routes */}
      <Route path="/clinic" element={<RoleRoute allowedRoles={['CLINIC', 'ADMIN']}><ClinicLayout /></RoleRoute>}>
        <Route path="dashboard" element={<ClinicDashboard />} />
        <Route path="appointments" element={<ClinicAppointments />} />
        <Route path="services" element={<ClinicServices />} />
        <Route path="profile" element={<ClinicProfile />} />
        <Route path="veterinarians" element={<ClinicVeterinarians />} />
        <Route path="customers" element={<ClinicCustomers />} />
        {/* Add more clinic routes here */}
      </Route>

      {/* Veterinarian Routes */}
      <Route path="/veterinarian" element={<RoleRoute allowedRoles={['VETERINARIAN', 'ADMIN']}><VeterinarianLayout /></RoleRoute>}>
        <Route path="dashboard" element={<VetDashboard />} />
        <Route path="schedule" element={<VetSchedule />} />
        <Route path="patients" element={<VetPatients />} />
        <Route path="records" element={<VetMedicalRecords />} />
        <Route path="profile" element={<VetProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminLayout /></RoleRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="clinics" element={<AdminClinics />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
