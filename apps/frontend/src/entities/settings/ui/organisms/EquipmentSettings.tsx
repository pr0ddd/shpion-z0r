import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
  Snackbar,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import HeadsetIcon from '@mui/icons-material/Headset';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useRoomContext, useMediaDeviceSelect } from '@livekit/components-react';

const persist = (key: string, id: string) => {
  try {
    localStorage.setItem(key, id);
  } catch {}
};

export const EquipmentSettings: React.FC = () => {
  const room = useRoomContext();

  /* --- LiveKit hooks for each kind --- */
  const micSel = useMediaDeviceSelect({ kind: 'audioinput', room });
  const spkSel = useMediaDeviceSelect({ kind: 'audiooutput', room });
  const camSel = useMediaDeviceSelect({ kind: 'videoinput', room });

  /* --- Snackbar for errors --- */
  const [snack, setSnack] = useState<string>('');
  const showErr = (msg: string) => setSnack(msg);

  /* --- Mic test --- */
  const [testingMic, setTestingMic] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const startMicTest = async () => {
    if (testingMic) return;
    setTestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: micSel.activeDeviceId || undefined } });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      src.connect(ctx.destination);
      setTimeout(() => {
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        setTestingMic(false);
      }, 4000);
    } catch {
      showErr('Не удалось открыть выбранный микрофон');
      setTestingMic(false);
    }
  };

  /* --- Speaker test --- */
  const playTestSound = async () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 440;

      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 1);

      const audio = new Audio();
      audio.srcObject = dest.stream as any;
      if ('setSinkId' in audio && spkSel.activeDeviceId) {
        // @ts-ignore
        await audio.setSinkId(spkSel.activeDeviceId);
      }

      await audio.play();
      // завершить context после окончания
      setTimeout(() => ctx.close(), 1200);
    } catch {
      showErr('Не удалось воспроизвести звук');
    }
  };

  /* --- Camera preview --- */
  const [previewOpen, setPreviewOpen] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);
  const openPreview = async () => {
    setPreviewOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: camSel.activeDeviceId || undefined } });
      if (vidRef.current) {
        vidRef.current.srcObject = stream;
        vidRef.current.onloadedmetadata = () => vidRef.current?.play();
      }
    } catch {
      showErr('Не удалось открыть камеру');
    }
  };
  const closePreview = () => {
    setPreviewOpen(false);
    if (vidRef.current && vidRef.current.srcObject) {
      (vidRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      vidRef.current.srcObject = null;
    }
  };

  /* --- Persist selections on change --- */
  const handleSelect = (kind: 'mic' | 'spk' | 'cam', id: string) => {
    if (kind === 'mic') {
      micSel.setActiveMediaDevice(id);
      persist('settings.audioInputId', id);
    } else if (kind === 'spk') {
      spkSel.setActiveMediaDevice(id);
      persist('settings.audioOutputId', id);
    } else {
      camSel.setActiveMediaDevice(id);
      persist('settings.videoInputId', id);
    }
  };

  const renderSelect = (devices: MediaDeviceInfo[], value: string, onChange: (v: string) => void) => (
    <Select size="small" fullWidth value={value} onChange={(e) => onChange(e.target.value)}>
      {devices.map((d) => (
        <MenuItem key={d.deviceId} value={d.deviceId}>
          {d.label || d.deviceId}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h6">Настройки оборудования</Typography>

      {/* Mic */}
      <Card sx={{ backgroundColor: 'new.card', border: '1px solid', borderColor: 'new.border' }}>
        <CardHeader avatar={<MicIcon />} title="Микрофон" />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderSelect(micSel.devices, micSel.activeDeviceId, (id) => handleSelect('mic', id))}
          <Button variant="outlined" onClick={startMicTest} disabled={testingMic}>
            {testingMic ? '...' : 'Тест микрофона'}
          </Button>
        </CardContent>
      </Card>

      {/* Speaker */}
      <Card sx={{ backgroundColor: 'new.card', border: '1px solid', borderColor: 'new.border' }}>
        <CardHeader avatar={<HeadsetIcon />} title="Динамики / Наушники" />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderSelect(spkSel.devices, spkSel.activeDeviceId, (id) => handleSelect('spk', id))}
          <Button variant="outlined" onClick={playTestSound}>Тестовый звук</Button>
        </CardContent>
      </Card>

      {/* Camera */}
      <Card sx={{ backgroundColor: 'new.card', border: '1px solid', borderColor: 'new.border' }}>
        <CardHeader avatar={<VideocamIcon />} title="Камера" />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderSelect(camSel.devices, camSel.activeDeviceId, (id) => handleSelect('cam', id))}
          <Button variant="outlined" onClick={openPreview}>Тест веб-камеры</Button>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onClose={closePreview} maxWidth="sm" fullWidth>
        <DialogTitle>Предпросмотр камеры</DialogTitle>
        <DialogContent>
          <video ref={vidRef} style={{ width: '100%' }} />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={3000}
        message={snack}
        onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
