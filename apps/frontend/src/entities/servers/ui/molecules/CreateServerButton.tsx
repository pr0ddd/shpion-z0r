import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@ui/atoms/IconButton';
import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';

const CreateServerButton: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <IconButton
        hasBorder={false}
        icon={<AddIcon />}
        onClick={() => setIsCreateDialogOpen(true)}
      />

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};

export default CreateServerButton;
