import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AuthPage from './components/AuthPage';
import InvitePage from './components/InvitePage';
import ProtectedAppLayout from './components/ProtectedAppLayout';
import { useAuth } from './contexts/AuthContext';
import SourcePicker, { Source } from './components/SourcePicker';
import './App.css';

interface ElectronApi {
  onShowSourcePicker: (callback: (sources: Source[]) => void) => void;
  sendSourceSelection: (id: string | null) => void;
  removeAllListeners: (channel: string) => void;
}

const electronApi = (window as any).electronAPI as ElectronApi;

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (electronApi) {
      const handleShowPicker = (sources: Source[]) => {
        setSources(sources);
        setPickerVisible(true);
      };

      electronApi.onShowSourcePicker(handleShowPicker);

      return () => {
        electronApi.removeAllListeners('show-source-picker');
      };
    }
  }, []);

  const handleSelectSource = (id: string) => {
    setPickerVisible(false);
    electronApi.sendSourceSelection(id);
  };

  const handleCancelPicker = () => {
    setPickerVisible(false);
    electronApi.sendSourceSelection(null);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        {/* Можно добавить спиннер */}
      </Box>
    );
  }

  return (
    <>
      {isPickerVisible && <SourcePicker sources={sources} onSelect={handleSelectSource} onCancel={handleCancelPicker} />}
      <Routes>
        <Route path="/" element={user ? <ProtectedAppLayout /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/invite/:inviteCode" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;
