import { useEffect, useState } from 'react';
import { ADMIN_DASHBOARD_PASS } from '@configs';
import { Box } from '@mui/material';
import { SystemSettingsTemplate } from '@entities/systemSettings';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    const password = prompt('Enter the password');
    if (password === ADMIN_DASHBOARD_PASS) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
        }}
      >
        Вводи пароль или иди НАХУЙ!
      </Box>
    );
  }

  return <SystemSettingsTemplate />;
};
