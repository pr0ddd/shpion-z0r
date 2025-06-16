import React, { useState } from 'react';
import { Box, Typography, Card, CardActionArea, CardMedia, CardContent, Tabs, Tab, Button } from '@mui/material';

export interface Source {
  id: string;
  name: string;
  thumbnail: string;
}

interface MediaSourceSelectorProps {
  sources: Source[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}

export const MediaSourceSelector: React.FC<MediaSourceSelectorProps> = ({ sources, onSelect, onCancel }) => {
  const [tabIndex, setTabIndex] = useState(0);

  const screens = sources.filter(source => source.id.startsWith('screen:'));
  const applications = sources.filter(source => source.id.startsWith('window:'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const renderSources = (sourceList: Source[]) => (
     <Box sx={{
          width: '100%',
          flexGrow: 1,
          overflowY: 'auto',
          p: 1, // padding for scrollbar space
           '&::-webkit-scrollbar': { width: '12px' },
           '&::-webkit-scrollbar-track': { background: '#1e1e1e', borderRadius: '10px' },
           '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: '10px', border: '3px solid #1e1e1e' },
           '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#777' }
        }}>
        <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2em',
            justifyContent: 'center',
            p: 2
        }}>
          {sourceList.map((source) => (
            <Card 
              key={source.id}
              sx={{ 
                  width: 280,
                  height: 220,
                  bgcolor: '#2b2b2b', 
                  color: 'white',
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0, 123, 255, 0.5)',
                  }
              }}
              onClick={() => onSelect(source.id)}
            >
              <CardActionArea sx={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
                <CardMedia
                  component="img"
                  image={source.thumbnail}
                  alt={source.name}
                  sx={{height: 170, objectFit: 'contain', bgcolor: '#222', p: 0.5}}
                />
                <CardContent sx={{flexGrow: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Typography variant="body2" noWrap title={source.name}>
                    {source.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 1, sm: 2, md: 4 },
        boxSizing: 'border-box'
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
        Выберите источник для трансляции
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#2b2b2b', borderRadius: '8px 8px 0 0' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} centered 
            sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#007bff' },
                '& .MuiTab-root': { color: '#e0e0e0' },
                '& .Mui-selected': { color: '#ffffff' }
            }}
        >
          <Tab label={`Экраны (${screens.length})`} />
          <Tab label={`Приложения (${applications.length})`} />
        </Tabs>
      </Box>

      {tabIndex === 0 && renderSources(screens)}
      {tabIndex === 1 && renderSources(applications)}

       <Box sx={{mt: 'auto', pt: 2}}>
         <Button 
            onClick={onCancel}
            variant="contained"
            sx={{ 
                backgroundColor: '#555', 
                '&:hover': { backgroundColor: '#777' }
            }}
         >
            Отмена
        </Button>
      </Box>
    </Box>
  );
}; 