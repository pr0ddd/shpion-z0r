import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';

import { useAuth } from '@features/auth';

import AuthPage from './pages/AuthPage';
import InvitePage from './pages/InvitePage';
import StreamPage from './pages/StreamPage';
import ServerPage from './pages/ServerPage';


const RequireAuth = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

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

export default App;
