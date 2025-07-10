import { IconButton } from '@ui/atoms/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSessionStore } from '@entities/session/model/auth.store';
import { useNavigate } from 'react-router-dom';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <IconButton
        hasBorder={false}
        icon={<LogoutIcon />}
        onClick={handleLogout}
      />
    </>
  );
};

export default LogoutButton;
