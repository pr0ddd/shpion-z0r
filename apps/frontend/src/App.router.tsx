import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import {
  AuthTemplate,
  SessionLoader,
  useSessionStore,
  useUserQuery,
} from '@entities/session';

import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServerPage from './pages/ServerPage';

const RequireAuth = () => {
  const { isLoading } = useUserQuery();
  const isAuthenticated = useSessionStore((s) => !!s.user);

  if (isLoading) return <SessionLoader />;

  return isAuthenticated ? <Outlet /> : null;
};

const AppRouter: React.FC = () => {
  const location = useLocation();
  const isLoginMode = location.pathname === '/login';

  return (
    <>
      <Routes>
        <Route element={<AuthTemplate isLoginMode={isLoginMode} />}>
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
