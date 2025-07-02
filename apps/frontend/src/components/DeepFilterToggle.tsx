import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Slider,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
} from '@mui/material';
import {
  FilterAlt,
  FilterAltOff,
  Settings,
  TuneRounded,
} from '@mui/icons-material';

export interface DeepFilterSettings {
  enabled: boolean;
  attenLim: number;      // дБ ослабления (10-200)
  postFilterBeta: number; // пост-фильтр (0-0.1)
}

interface DeepFilterToggleProps {
  settings: DeepFilterSettings;
  onChange: (settings: DeepFilterSettings) => void;
  isReady?: boolean;
  isLoading?: boolean;
  error?: string | null;
  stats?: {
    framesProcessed: number;
    lastSnr?: number;
  };
}

export const DeepFilterToggle: React.FC<DeepFilterToggleProps> = ({
  settings,
  onChange,
  isReady = false,
  isLoading = false,
  error = null,
  stats
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleToggle = () => {
    onChange({
      ...settings,
      enabled: !settings.enabled
    });
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAttenLimChange = (_: Event, value: number | number[]) => {
    onChange({
      ...settings,
      attenLim: Array.isArray(value) ? value[0] : value
    });
  };

  const handlePostFilterChange = (_: Event, value: number | number[]) => {
    onChange({
      ...settings,
      postFilterBeta: Array.isArray(value) ? value[0] : value
    });
  };

  const getStatusColor = () => {
    if (error) return 'error';
    if (isLoading) return 'warning';
    if (settings.enabled && isReady) return 'primary';
    return 'default';
  };

  const getTooltipText = () => {
    if (error) return `DeepFilter ошибка: ${error}`;
    if (isLoading) return 'DeepFilter загружается...';
    if (settings.enabled && isReady) return 'DeepFilter активен';
    if (settings.enabled && !isReady) return 'DeepFilter инициализируется...';
    return 'DeepFilter отключен';
  };

  return (
    <>
      {/* Основная кнопка включения/выключения */}
      <Tooltip title={getTooltipText()}>
        <IconButton
          onClick={handleToggle}
          color={getStatusColor()}
          disabled={isLoading}
          size="small"
        >
          <Badge
            color="success"
            variant="dot"
            invisible={!settings.enabled || !isReady}
          >
            {settings.enabled ? <FilterAlt /> : <FilterAltOff />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Кнопка настроек */}
      <Tooltip title="Настройки DeepFilter">
        <IconButton
          onClick={handleSettingsClick}
          disabled={isLoading}
          size="small"
          color={settings.enabled ? 'primary' : 'default'}
        >
          <TuneRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Меню настроек */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 320, p: 2 }
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            🎤 DeepFilterNet
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => onChange({
                  ...settings,
                  enabled: e.target.checked
                })}
                color="primary"
              />
            }
            label="Включить подавление шума"
          />
        </Box>

        {settings.enabled && (
          <>
            <Divider sx={{ my: 2 }} />
            
            {/* Настройка ослабления */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Ослабление шума: {settings.attenLim} дБ
              </Typography>
              <Slider
                value={settings.attenLim}
                onChange={handleAttenLimChange}
                min={10}
                max={200}
                step={5}
                valueLabelDisplay="auto"
                disabled={!isReady}
              />
              <Typography variant="caption" color="text.secondary">
                Чем больше значение, тем сильнее подавление шума
              </Typography>
            </Box>

            {/* Настройка пост-фильтра */}
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Пост-фильтр: {(settings.postFilterBeta * 100).toFixed(1)}%
              </Typography>
              <Slider
                value={settings.postFilterBeta}
                onChange={handlePostFilterChange}
                min={0}
                max={0.1}
                step={0.005}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                disabled={!isReady}
              />
              <Typography variant="caption" color="text.secondary">
                Дополнительное ослабление очень шумных участков
              </Typography>
            </Box>

            {/* Статистика */}
            {stats && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="caption" display="block" gutterBottom>
                    Статистика:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Обработано кадров: {stats.framesProcessed}
                  </Typography>
                  {stats.lastSnr && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      SNR: {stats.lastSnr.toFixed(2)} дБ
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Статус */}
            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isReady ? 'success.main' : 'warning.main',
                    mr: 1
                  }}
                />
                {isReady ? 'DeepFilter готов' : 'Инициализация...'}
              </Typography>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}; 