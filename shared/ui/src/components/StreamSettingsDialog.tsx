import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { StreamSettings, useStreamSettingsStore, VideoCodec } from '@shared/hooks/store/streamSettings';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const resolutions: StreamSettings['resolution'][] = ['540p', '720p', '1080p', '1440p', '2160p'];
const codecs: VideoCodec[] = ['vp8', 'h264', 'vp9', 'av1'];

export const StreamSettingsDialog: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  const { settings, setSettings } = useStreamSettingsStore();
  const [local, setLocal] = useState<StreamSettings>(settings);

  const handleConfirm = () => {
    setSettings(local);
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Stream Settings</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="codec-label">Codec</InputLabel>
          <Select
            labelId="codec-label"
            value={local.codec}
            label="Codec"
            onChange={(e) => setLocal({ ...local, codec: e.target.value as VideoCodec })}
          >
            {codecs.map((c) => (
              <MenuItem key={c} value={c}>
                {c.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="res-label">Resolution</InputLabel>
          <Select
            labelId="res-label"
            value={local.resolution}
            label="Resolution"
            onChange={(e) => setLocal({ ...local, resolution: e.target.value as any })}
          >
            {resolutions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="FPS"
          type="number"
          slotProps={{ input: { inputProps: { min: 1, max: 120 } } } as any}
          value={local.fps}
          onChange={(e) => setLocal({ ...local, fps: Number(e.target.value) })}
        />

        <TextField
          label="Max Bitrate (kbps)"
          type="number"
          slotProps={{ input: { inputProps: { min: 100, max: 10000 } } } as any}
          value={local.maxBitrate / 1000}
          onChange={(e) => setLocal({ ...local, maxBitrate: Number(e.target.value) * 1000 })}
        />

        <FormControlLabel
          control={<Checkbox checked={local.dynacast} onChange={(e) => setLocal({ ...local, dynacast: e.target.checked })} />}
          label="Enable Dynacast"
        />
        <FormControlLabel
          control={<Checkbox checked={local.adaptiveStream} onChange={(e) => setLocal({ ...local, adaptiveStream: e.target.checked })} />}
          label="Enable Adaptive Stream"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Start Sharing
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 