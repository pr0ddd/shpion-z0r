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
        size="small"
        icon={<AddIcon />}
        onClick={() => setIsCreateDialogOpen(true)}
        sx={{ width:44, height:44, p:1, borderRadius:1, backgroundColor:'new.card' }}
      />

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};

export default CreateServerButton;
