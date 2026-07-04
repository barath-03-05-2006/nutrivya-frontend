import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import ClientDashboard from './pages/client/ClientDashboard';
import TodaysMeals from './pages/client/TodaysMeals';
import ClientProgress from './pages/client/ClientProgress';
import ClientProfile from './pages/client/ClientProfile';
import MyPlans from './pages/client/MyPlans';
import DietitianDashboard from './pages/dietitian/DietitianDashboard';
import ClientsList from './pages/dietitian/ClientsList';
import ClientDetail from './pages/dietitian/ClientDetail';
import CreateMealPlan from './pages/dietitian/CreateMealPlan';
import Alerts from './pages/dietitian/Alerts';
import ManageClients from './pages/dietitian/ManageClients';
import Layout from './components/layout/Layout';

const Protected = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'DIETITIAN' ? '/dietitian' : '/client'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/client" element={<Protected role="CLIENT"><Layout><ClientDashboard /></Layout></Protected>} />
          <Route path="/client/meals" element={<Protected role="CLIENT"><Layout><TodaysMeals /></Layout></Protected>} />
          <Route path="/client/progress" element={<Protected role="CLIENT"><Layout><ClientProgress /></Layout></Protected>} />
          <Route path="/client/profile" element={<Protected role="CLIENT"><Layout><ClientProfile /></Layout></Protected>} />
          <Route path="/client/my-plans" element={<Protected role="CLIENT"><Layout><MyPlans /></Layout></Protected>} />
          <Route path="/dietitian" element={<Protected role="DIETITIAN"><Layout><DietitianDashboard /></Layout></Protected>} />
          <Route path="/dietitian/clients" element={<Protected role="DIETITIAN"><Layout><ClientsList /></Layout></Protected>} />
          <Route path="/dietitian/clients/:clientId" element={<Protected role="DIETITIAN"><Layout><ClientDetail /></Layout></Protected>} />
          <Route path="/dietitian/create-meal-plan" element={<Protected role="DIETITIAN"><Layout><CreateMealPlan /></Layout></Protected>} />
          <Route path="/dietitian/alerts" element={<Protected role="DIETITIAN"><Layout><Alerts /></Layout></Protected>} />
          <Route path="/dietitian/manage-clients" element={<Protected role="DIETITIAN"><Layout><ManageClients /></Layout></Protected>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
