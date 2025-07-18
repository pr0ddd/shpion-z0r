import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import { AuthTemplate, SessionLoader, useUserQuery } from '@entities/session';

import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServerPage from './pages/ServerPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { useSystemSettingsQuery } from '@entities/systemSettings/api/systemSettings.query';
import { useSystemSettingsStore } from '@entities/systemSettings';

const RequireAuth = () => {
  const { data, isFetching } = useUserQuery();
  const location = useLocation();

  if (isFetching) return <SessionLoader />;

  return data ? (
    <Outlet />
  ) : (
    <Navigate to={`/login?redirect=${location.pathname}`} replace />
  );
};

const RequireSystemSettings = () => {
  const { data: systemSettings } = useSystemSettingsQuery();
  const isReady = useSystemSettingsStore((s) => s.isReady);
  const setSystemSettings = useSystemSettingsStore((s) => s.setSystemSettings);

  useEffect(() => {
    if (systemSettings) {
      setSystemSettings(systemSettings);
    }
  }, [systemSettings]);

  if (!isReady) return <SessionLoader />;

  return <Outlet />;
};

const AppRouter: React.FC = () => {
  return (
    <>
      <Routes>
        <Route element={<AuthTemplate />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<RequireSystemSettings />}>
            <Route path="/" element={<ServerPage />} />
          </Route>
          <Route path="/invite/:inviteCode" element={<InvitePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
};

export default AppRouter;
