import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import {
  AuthTemplate,
  SessionLoader,
  useUserQuery,
} from '@entities/session';

import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServerPage from './pages/ServerPage';

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

const AppRouter: React.FC = () => {
  return (
    <>
      <Routes>
        <Route element={<AuthTemplate />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<ServerPage />} />
          <Route path="/invite/:inviteCode" element={<InvitePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </>
  );
};

export default AppRouter;
