import { useState } from 'react';
import { IconButton } from '../atoms/IconButton';
import AddIcon from '@mui/icons-material/Add';
import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';

const CreateServerButton: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <IconButton
        tooltip="Создать сервер"
        icon={<AddIcon />}
        onClick={() => setIsCreateDialogOpen(true)}
        active={false}
      />

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};

export default CreateServerButton;
