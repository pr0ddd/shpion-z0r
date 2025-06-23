import React from 'react';
import { Box, IconButton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Props {
  onPopout: () => void;
}

const StreamTileOverlay: React.FC<Props> = ({ onPopout }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.35)',
        opacity: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        transition: 'opacity .2s',
        '&:hover': {
          opacity: 1,
        },
      }}
    >
      <IconButton size="small" onClick={(e)=>{e.stopPropagation(); onPopout();}} sx={{ bgcolor:'primary.main', color:'#fff', width:32, height:24, borderRadius:1, p:0, '&:hover':{ bgcolor:'primary.dark' } }}>
        <OpenInNewIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
};

export default StreamTileOverlay; 