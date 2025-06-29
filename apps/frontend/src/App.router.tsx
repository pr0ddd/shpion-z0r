import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import { useAuth } from '@features/auth';

import { AuthLayout } from '@components/AuthLayout';

import InvitePage from './pages/InvitePage';
import StreamPage from './pages/StreamPage';
import ServerPage from './pages/ServerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const RequireAuth = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRouter: React.FC = () => {
  const location = useLocation();
  const isLoginMode = location.pathname === '/login';

  return (
    <>
      <Routes>
        <Route element={<AuthLayout isLoginMode={isLoginMode} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<ServerPage />} />
          <Route path="/invite/:inviteCode" element={<InvitePage />} />
          <Route path="/stream/:serverId/:trackSid" element={<StreamPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </>
  );
};

export default AppRouter;
