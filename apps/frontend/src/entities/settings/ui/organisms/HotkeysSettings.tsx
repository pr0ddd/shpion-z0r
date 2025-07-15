import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton as MuiIconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import EditIcon from '@mui/icons-material/Edit';

import {
  useHotkeysStore,
  HotkeyAction,
  defaultHotkeys,
  useHotkeyCaptureStore,
} from '../../model/hotkeys.store';

interface Item {
  action: HotkeyAction;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
}

const ITEMS: Item[] = [
  {
    action: 'toggle-mic',
    title: 'Включить/выключить микрофон',
    subtitle: 'Быстрое отключение звука микрофона',
    icon: <MicIcon fontSize="small" />,
  },
  {
    action: 'toggle-camera',
    title: 'Включить/выключить камеру',
    subtitle: 'Включение и выключение видеопотока',
    icon: <VideocamIcon fontSize="small" />,
  },
  {
    action: 'toggle-screen',
    title: 'Демонстрация экрана',
    subtitle: 'Начать или остановить показ экрана',
    icon: <ScreenShareIcon fontSize="small" />,
  },
  {
    action: 'toggle-speaker',
    title: 'Включить/выключить звук',
    subtitle: 'Отключение входящего звука',
    icon: <VolumeUpIcon fontSize="small" />,
  },
  {
    action: 'stop-streams',
    title: 'Остановить все стримы',
    subtitle: 'Прекратить все демонстрации экрана',
    icon: <ScreenShareIcon fontSize="small" />,
  },
];

export const HotkeysSettings: React.FC = () => {
  const store = useHotkeysStore();
  const setGlobalCapture = useHotkeyCaptureStore((s) => s.setCapturing);
  const [draft, setDraft] = useState({ ...store.hotkeys });
  const [capturing, setCapturing] = useState<HotkeyAction | null>(null);
  const [snack, setSnack] = useState('');

  React.useEffect(() => {
    return () => setGlobalCapture(false);
  }, []);

  /*────────────── helpers ──────────────*/
  const startCapture = (action: HotkeyAction) => {
    setCapturing(action);
    setGlobalCapture(true);
    setSnack('Нажмите желаемую комбинацию…');

    const activeMods = new Set<string>();
    const isModifierCode = (code: string) =>
      [
        'ControlLeft',
        'ControlRight',
        'ShiftLeft',
        'ShiftRight',
        'AltLeft',
        'AltRight',
        'MetaLeft',
        'MetaRight',
      ].includes(code);

    const keydownHandler = (e: KeyboardEvent) => {
      if (isModifierCode(e.code)) {
        if (e.code.startsWith('Control')) activeMods.add('Ctrl');
        if (e.code.startsWith('Shift')) activeMods.add('Shift');
        if (e.code.startsWith('Alt')) activeMods.add('Alt');
        if (e.code.startsWith('Meta')) activeMods.add('Meta');
        return;
      }

      e.preventDefault();

      const parts: string[] = Array.from(activeMods);
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');

      const uniqueParts = Array.from(new Set(parts));
      const keyPart = e.code.startsWith('Key')
        ? e.code.slice(3)
        : e.code.startsWith('Digit')
        ? e.code.slice(5)
        : e.code;
      uniqueParts.push(keyPart);

      if (uniqueParts.length > 3) {
        setSnack('Максимум 3 клавиши в комбинации');
        activeMods.clear();
        return;
      }

      const combo = uniqueParts.join('+');
      setDraft((prev) => ({ ...prev, [action]: combo }));
      setSnack(`Назначено: ${combo}`);
      setCapturing(null);
      setGlobalCapture(false);
      window.removeEventListener('keydown', keydownHandler, true);
    };
    window.addEventListener('keydown', keydownHandler, true);
  };

  const resetOne = (action: HotkeyAction) => {
    setDraft((prev) => ({ ...prev, [action]: defaultHotkeys[action] }));
  };

  const resetAll = () => {
    setDraft({ ...defaultHotkeys });
  };

  const save = () => {
    store.setAllHotkeys(draft);
    setSnack('Горячие клавиши сохранены');
  };

  /*────────────── UI ──────────────*/
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Горячие клавиши</Typography>
        <Button startIcon={<RefreshIcon />} onClick={resetAll}>
          Сбросить все
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Настройте сочетания клавиш для быстрого управления
      </Typography>

      {/* List */}
      {ITEMS.map((item) => (
        <Card
          key={item.action}
          sx={{ backgroundColor: 'new.card', border: '1px solid', borderColor: 'new.border' }}
        >
          <CardContent
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
          >
            {/* Left block with icon + texts */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {item.icon}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2">{item.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Shortcut chip */}
            <Chip
              label={draft[item.action] ?? 'Не назначено'}
              sx={{ fontFamily: 'monospace' }}
              variant="outlined"
            />

            {/* Edit & reset buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => startCapture(item.action)}
                disabled={capturing !== null}
              >
                Изменить
              </Button>
              <MuiIconButton onClick={() => resetOne(item.action)} size="small">
                <RefreshIcon fontSize="small" />
              </MuiIconButton>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" color="primary" onClick={save}>
          Сохранить горячие клавиши
        </Button>
      </Box>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  );
};