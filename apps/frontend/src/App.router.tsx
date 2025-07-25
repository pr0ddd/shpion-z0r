import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import { AuthTemplate, useUserQuery } from '@entities/session';

import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServerPage from './pages/ServerPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { useSystemSettingsQuery } from '@entities/systemSettings/api/systemSettings.query';
import { useSystemSettingsStore } from '@entities/systemSettings';
import { useDeepFilterModelStore } from '@libs/deepFilterNet/modelLoad.store';

const RequireAuth = () => {
  const { data, isFetching } = useUserQuery();
  const location = useLocation();

  if (isFetching) return null;

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

  if (!isReady) return null;

  return <Outlet />;
};

const RequireDeepFilter: React.FC = () => {
  const loaded = useDeepFilterModelStore((s)=>s.loaded);
  if(!loaded) return null;
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
            <Route element={<RequireDeepFilter />}>
              <Route path="/" element={<ServerPage />} />
            </Route>
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
