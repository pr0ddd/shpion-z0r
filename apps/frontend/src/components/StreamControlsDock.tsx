import React from 'react';
import { Box, IconButton, SxProps, Theme } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

interface Props {
  chatVisible?: boolean;
  onToggleChat?: () => void;
  showStats?: boolean;
  onToggleStats?: () => void;
  isStreamer?: boolean;
  showStop?: boolean;
  onStopView?: () => void;
  sxOverride?: SxProps<Theme>;
}

const StreamControlsDock: React.FC<Props> = ({ chatVisible=true, onToggleChat, showStats=false, onToggleStats, isStreamer=false, showStop=false, onStopView, sxOverride }) => {
  return (
    <Box sx={{ width:'100%', px:2, py:1, display:'flex', alignItems:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', ...sxOverride }}>
      <Box sx={{ ml:'auto', display:'flex', alignItems:'center', gap:1 }}>
        {showStop && (
          <IconButton size='small' onClick={onStopView ?? (()=>{})}>
            <StopScreenShareIcon fontSize='inherit' />
          </IconButton>
        )}
        {isStreamer && (
          <IconButton size='small' onClick={onToggleStats ?? (()=>{})} color={showStats? 'primary':'default'}>
            <BarChartIcon fontSize='inherit' />
          </IconButton>
        )}
        <IconButton size='small' onClick={onToggleChat ?? (()=>{})} color={chatVisible? 'primary':'default'}>
          <ChatBubbleOutlineIcon fontSize='inherit' />
        </IconButton>
      </Box>
    </Box>
  );
};

export default StreamControlsDock; 