import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box } from '@mui/material';
import AuthPage from './components/AuthPage';
import InvitePage from './components/InvitePage';
import ProtectedAppLayout from './components/ProtectedAppLayout';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <ProtectedAppLayout /> : <Navigate to="/auth" />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/invite/:inviteCode" element={<InvitePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
