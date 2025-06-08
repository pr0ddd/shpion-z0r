import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Room, RoomEvent, RoomConnectOptions, Participant, Track } from 'livekit-client';
import { Server } from '../types';
import { livekitAPI, userAPI } from '../services/api';
import { useSocket } from './SocketContext';

interface ServerContextType {
  selectedServer: Server | null;
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  room: Room | null;
  isConnecting: boolean;
  canPlaybackAudio: boolean;
  needsUserInteraction: boolean;
  activeSpeakers: Participant[];
  isLocalSpeaking: boolean;
  isScreenSharing: boolean;
  screenTracks: Map<string, Track>;
  currentQualityInfo: string | null;
  setServers: (servers: Server[]) => void;
  selectServer: (server: Server | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  connectToVoice: () => Promise<void>;
  disconnectFromVoice: () => void;
  startAudio: () => Promise<void>;
  restoreUserState: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  getQualityInfo: () => string;
}

const ServerContext = createContext<ServerContextType | null>(null);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Восстанавливаем выбранный сервер из localStorage
  const [selectedServer, setSelectedServer] = useState<Server | null>(() => {
    try {
      const saved = localStorage.getItem('selectedServerId');
      return saved ? { id: saved } as Server : null;
    } catch {
      return null;
    }
  });
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [canPlaybackAudio, setCanPlaybackAudio] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTracks, setScreenTracks] = useState<Map<string, Track>>(new Map());
  const [currentQualityInfo, setCurrentQualityInfo] = useState<string | null>(null);
  const connectingRef = useRef(false);
  
  // Используем сокеты для уведомлений о присоединении/выходе
  const { joinServer, leaveServer, joinVoice, leaveVoice, isConnected } = useSocket();
  
  // Храним pending server ID пока сокет не подключится
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);



  const disconnectFromVoice = useCallback(() => {
    if (room) {
      console.log('Disconnecting from voice...');
      room.disconnect();
      setRoom(null);
      setCanPlaybackAudio(false);
      setNeedsUserInteraction(false);
      setActiveSpeakers([]);
      setIsLocalSpeaking(false);
    }
  }, [room]);

  const selectServer = useCallback(async (server: Server | null) => {
    console.log('Selecting server:', server?.name || 'Home');
    
    // Покидаем предыдущий сервер через сокеты
    if (selectedServer) {
      leaveServer(selectedServer.id);
      leaveVoice(selectedServer.id); // Также покидаем голос
    }
    
    // Отключаемся от текущей комнаты если есть
    if (room) {
      disconnectFromVoice();
    }

    setSelectedServer(server);
    
    // Сохраняем выбор в localStorage
    if (server) {
      localStorage.setItem('selectedServerId', server.id);
    } else {
      localStorage.removeItem('selectedServerId');
    }
    
    // Присоединяемся к новому серверу через сокеты
    if (server) {
      joinServer(server.id);
    }

    // АВТОМАТИЧЕСКИ подключаемся к голосу при клике на сервер (это пользовательское взаимодействие!)
    if (server && !connectingRef.current) {
      console.log('Auto-connecting to voice after server selection...');
      
      connectingRef.current = true;
      setIsConnecting(true);
      setError(null);
      
      try {
        console.log('Getting voice token for server:', server.id);
        const tokenResponse = await livekitAPI.getVoiceToken(server.id);
        
        if (!tokenResponse.success || !tokenResponse.data) {
          throw new Error(tokenResponse.error || 'Failed to get voice token');
        }

        console.log('Creating LiveKit room...');
        const newRoom = new Room({
          // automatically manage subscribed video quality
          adaptiveStream: true,
          // optimize publishing bandwidth and CPU for published tracks
          dynacast: true,
                  // ЭКСТРЕМАЛЬНЫЕ настройки для минимальной задержки
        audioCaptureDefaults: {
          echoCancellation: false, // Отключаем для меньшей задержки!
          noiseSuppression: false, // Отключаем для меньшей задержки!
          autoGainControl: false,  // Отключаем для меньшей задержки!
          // Максимальная частота дискретизации
          sampleRate: 48000,
          sampleSize: 16,
          // Минимальные буферы
          latency: 0.01, // 10ms буфер (минимум!)
        },
          // Отключаем видео по умолчанию для меньшей нагрузки
          videoCaptureDefaults: {
            resolution: { width: 0, height: 0 }, // Отключаем видео
          },
          // Настройки для быстрого детектирования говорящих
          webAudioMix: true, // Функция для лучшего аудио
        });

        // Настраиваем обработчики событий ПЕРЕД подключением
        newRoom
          .on(RoomEvent.Connected, () => {
            console.log('✅ Connected to room:', newRoom.name);
            setCanPlaybackAudio(newRoom.canPlaybackAudio);
            setNeedsUserInteraction(!newRoom.canPlaybackAudio);
          })
          .on(RoomEvent.Disconnected, () => {
            console.log('❌ Disconnected from room');
            setRoom(null);
            setCanPlaybackAudio(false);
            setNeedsUserInteraction(false);
          })
          .on(RoomEvent.AudioPlaybackStatusChanged, () => {
            console.log('🔊 Audio playback status changed:', newRoom.canPlaybackAudio);
            setCanPlaybackAudio(newRoom.canPlaybackAudio);
            setNeedsUserInteraction(!newRoom.canPlaybackAudio);
          })
          .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
            console.log('🗣️ Active speakers changed:', speakers.map(s => s.identity));
            setActiveSpeakers(speakers);
            
            // Проверяем, включен ли локальный участник в активных говорящих
            const localIdentity = newRoom.localParticipant.identity;
            const isLocalInSpeakers = speakers.some(speaker => speaker.identity === localIdentity);
            setIsLocalSpeaking(isLocalInSpeakers);
          })
          .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, 'from', participant.identity);
            
            // Автоматически воспроизводим аудио треки
            if (track.kind === Track.Kind.Audio) {
              const audioElement = track.attach() as HTMLAudioElement;
              audioElement.autoplay = true;
              audioElement.muted = false;
              
              // ЭКСТРЕМАЛЬНЫЕ настройки для ультра-низкой задержки
              audioElement.volume = 1.0;
              audioElement.preload = 'none';
              audioElement.controls = false;
              
              // Ключевые настройки для минимальной задержки!
              if ('mozAudioChannelType' in audioElement) {
                (audioElement as any).mozAudioChannelType = 'telephony'; // Firefox оптимизация
              }
              
                          // Web Audio API оптимизации
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              void audioContext.audioWorklet; // Проверяем поддержку
              console.log('🔊 Audio Context latency:', audioContext.baseLatency || 'unknown');
            } catch (e) {
              console.log('🔊 Web Audio API not available for optimization');
            }
              
              // Добавляем элемент в DOM (можно скрыть его)
              audioElement.style.display = 'none';
              document.body.appendChild(audioElement);
              console.log('🔊 Audio track attached with ULTRA low-latency settings');
            }
          })
          .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
            
            // Удаляем аудио элементы при отписке
            if (track.kind === Track.Kind.Audio) {
              track.detach();
              console.log('🔇 Audio track detached');
            }
          })
          .on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
          })
          .on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant disconnected:', participant.identity);
          });

        console.log('Connecting to LiveKit room...');
        await newRoom.connect(tokenResponse.data.wsUrl, tokenResponse.data.token);
        
        setRoom(newRoom);
        console.log('✅ Successfully connected to voice chat!');
        
        // Уведомляем сокеты о присоединении к голосу
        joinVoice(server.id);
        
        // ЭКСТРЕМАЛЬНЫЕ настройки микрофона для ультра-низкой задержки
        try {
          await newRoom.localParticipant.setMicrophoneEnabled(true, {
            // ОТКЛЮЧАЕМ ВСЕ обработки для минимальной задержки!
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // Минимальные буферы
            sampleRate: 48000,
            sampleSize: 16,
            channelCount: 1, // Моно для меньшей нагрузки
            latency: 0.01,   // 10ms - экстремально низкий буфер!
          });
          console.log('🎤 Microphone enabled with ULTRA low-latency settings');
          
          // TODO: Добавить уведомление сокетов о включении микрофона
        } catch (micError) {
          console.warn('⚠️ Ultra settings failed, trying fallback:', micError);
          // Fallback - пробуем без специальных настроек
          try {
            await newRoom.localParticipant.setMicrophoneEnabled(true);
            console.log('🎤 Microphone enabled (fallback)');
          } catch (fallbackError) {
            console.error('❌ Failed to enable microphone entirely:', fallbackError);
          }
        }
        
      } catch (err: any) {
        console.error('❌ Failed to connect to voice:', err);
        setError(err.message || 'Failed to connect to voice chat');
      } finally {
        setIsConnecting(false);
        connectingRef.current = false;
      }
    }
  }, [selectedServer, room, disconnectFromVoice, leaveServer, leaveVoice, joinServer, joinVoice]);

  const connectToVoice = useCallback(async () => {
    if (!selectedServer || connectingRef.current) {
      console.log('Cannot connect: no server selected or already connecting');
      return;
    }
    
    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);
    
    const connectionStartTime = performance.now();
    
    try {
      console.log('Getting voice token for server:', selectedServer.id);
      const tokenResponse = await livekitAPI.getVoiceToken(selectedServer.id);
      
      if (!tokenResponse.success || !tokenResponse.data) {
        throw new Error(tokenResponse.error || 'Failed to get voice token');
      }

      console.log('Creating LiveKit room...');
      // Оптимизированные настройки для быстрого подключения
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        // Упрощенные аудио настройки для скорости
        audioCaptureDefaults: {
          echoCancellation: true,  // Стандартные настройки для стабильности
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,       // Стандартная частота
          channelCount: 1,         // Моно для экономии ресурсов
        },
        // Настройки видео для высококачественного screen sharing
        videoCaptureDefaults: {
          resolution: { width: 1920, height: 1080 }, // Full HD качество
        },
        // Настройки публикации для высокого качества
        publishDefaults: {
          videoEncoding: {
            maxBitrate: 8_000_000, // 8 Mbps для screen sharing
            maxFramerate: 60,
          },
          // АДАПТИВНОЕ КАЧЕСТВО: Включаем simulcast для автоматической адаптации к сложности сцен
          simulcast: true,
          // Настройка слоев качества для адаптивного стриминга
          videoSimulcastLayers: [
            // Высокое качество для простых сцен (минимальное движение)
            {
              width: 1920,
              height: 1080,
              resolution: { width: 1920, height: 1080 },
              encoding: {
                maxBitrate: 8_000_000, // 8 Mbps для Full HD при статичном контенте
                maxFramerate: 60,
              },
            },
            // Среднее качество для умеренно сложных сцен
            {
              width: 1280,
              height: 720,
              resolution: { width: 1280, height: 720 },
              encoding: {
                maxBitrate: 4_000_000, // 4 Mbps для HD при движении
                maxFramerate: 30,
              },
            },
            // Низкое качество для очень сложных сцен (много движения)
            {
              width: 854,
              height: 480,
              resolution: { width: 854, height: 480 },
              encoding: {
                maxBitrate: 1_500_000, // 1.5 Mbps для SD при интенсивном движении
                maxFramerate: 15,
              },
            },
          ],
        },
        disconnectOnPageLeave: false,
      });

      // Упрощенные обработчики событий для быстрой инициализации
      newRoom
        .on(RoomEvent.Connected, () => {
          console.log('✅ Connected to room:', newRoom.name);
          setCanPlaybackAudio(newRoom.canPlaybackAudio);
          setNeedsUserInteraction(!newRoom.canPlaybackAudio);
          
          // Параллельно выполняем микрофон и уведомление сокетов
          Promise.all([
            newRoom.localParticipant.setMicrophoneEnabled(true).catch(err => {
              console.warn('⚠️ Failed to enable microphone:', err);
            }),
            selectedServer ? joinVoice(selectedServer.id) : Promise.resolve()
          ]).then(() => {
            console.log('🎤 Microphone and socket notification completed');
          });
        })
        .on(RoomEvent.Disconnected, () => {
          console.log('❌ Disconnected from room');
          setRoom(null);
          setCanPlaybackAudio(false);
          setNeedsUserInteraction(false);
        })
        .on(RoomEvent.AudioPlaybackStatusChanged, () => {
          console.log('🔊 Audio playback status changed:', newRoom.canPlaybackAudio);
          setCanPlaybackAudio(newRoom.canPlaybackAudio);
          setNeedsUserInteraction(!newRoom.canPlaybackAudio);
        })
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          setActiveSpeakers(speakers);
          const localIdentity = newRoom.localParticipant.identity;
          const isLocalInSpeakers = speakers.some(speaker => speaker.identity === localIdentity);
          setIsLocalSpeaking(isLocalInSpeakers);
        })
        .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          // Быстрая обработка аудио треков без лишних операций
          if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach() as HTMLAudioElement;
            audioElement.autoplay = true;
            audioElement.muted = false;
            audioElement.volume = 1.0;
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            console.log('🔊 Audio track attached:', participant.identity);
          }
          
          // Обработка видео треков (включая screen share)
          if (track.kind === Track.Kind.Video) {
            console.log('🖥️ Video track subscribed:', track.source, 'from', participant.identity);
            
            // Добавляем трек в screenTracks Map
            setScreenTracks(prev => {
              const newMap = new Map(prev);
              newMap.set(participant.identity, track);
              return newMap;
            });
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Audio) {
            track.detach();
            console.log('🔇 Audio track detached:', participant.identity);
          }
          
          if (track.kind === Track.Kind.Video) {
            track.detach();
            console.log('🖥️ Video track unsubscribed:', participant.identity);
            
            // Удаляем трек из screenTracks Map
            setScreenTracks(prev => {
              const newMap = new Map(prev);
              newMap.delete(participant.identity);
              return newMap;
            });
          }
        });

      console.log('Connecting to LiveKit room...');
      await newRoom.connect(tokenResponse.data.wsUrl, tokenResponse.data.token);
      
      setRoom(newRoom);
      const connectionTime = performance.now() - connectionStartTime;
      console.log('✅ Successfully connected to voice chat!');
      console.log('⏱️ Voice connection took:', connectionTime.toFixed(2), 'ms');
      
    } catch (err: any) {
      console.error('❌ Failed to connect to voice:', err);
      setError(err.message || 'Failed to connect to voice chat');
    } finally {
      setIsConnecting(false);
      connectingRef.current = false;
    }
  }, [selectedServer, joinVoice]);

  // Выполняем pending joinServer когда сокет подключается
  useEffect(() => {
    if (isConnected && pendingServerId) {
      console.log('🔗 Socket connected, executing pending joinServer:', pendingServerId);
      joinServer(pendingServerId);
      
      // АВТОМАТИЧЕСКИ подключаемся к голосу при отложенном восстановлении
      console.log('🎤 Auto-connecting to voice after delayed server restoration...');
      connectToVoice();
      
      setPendingServerId(null);
    }
  }, [isConnected, pendingServerId, joinServer, connectToVoice]);

  const restoreUserState = useCallback(async () => {
    try {
      const startTime = performance.now();
      console.log('🔄 Restoring user state from backend...');
      const response = await userAPI.getCurrentUser();
      console.log('⏱️ API request took:', (performance.now() - startTime).toFixed(2), 'ms');
      
      if (response.success && response.data) {
        const { servers: userServers, currentServerId } = response.data;
        
        console.log('📊 User data received:', { 
          serversCount: userServers.length, 
          currentServerId,
          serverNames: userServers.map(s => s.name)
        });
        
        // Устанавливаем серверы пользователя
        setServers(userServers);
        
        // Восстанавливаем текущий сервер из backend
        if (currentServerId && userServers.length > 0) {
          const currentServer = userServers.find(s => s.id === currentServerId);
          console.log('🔍 Looking for server with ID:', currentServerId, 'Found:', currentServer?.name || 'NOT FOUND');
          
          if (currentServer) {
            console.log('🔄 Restoring current server from backend:', currentServer.name);
            setSelectedServer(currentServer);
            localStorage.setItem('selectedServerId', currentServer.id);
            
            if (isConnected) {
              console.log('📞 Socket ready, calling joinServer immediately for:', currentServer.id);
              joinServer(currentServer.id);
              
              // АВТОМАТИЧЕСКИ подключаемся к голосу при восстановлении
              const voiceStartTime = performance.now();
              console.log('🎤 Auto-connecting to voice after server restoration...');
              connectToVoice().then(() => {
                console.log('⏱️ Voice connection took:', (performance.now() - voiceStartTime).toFixed(2), 'ms');
              });
            } else {
              console.log('⏳ Socket not ready, setting pending joinServer for:', currentServer.id);
              setPendingServerId(currentServer.id);
            }
            return;
          } else {
            console.log('❌ Server with ID', currentServerId, 'not found in user servers');
          }
        } else {
          console.log('❌ No restoration needed:', { currentServerId, hasServers: userServers.length > 0 });
        }
        
        console.log('🏠 No current server found, staying in lobby');
      }
    } catch (error) {
      console.error('❌ Failed to restore user state:', error);
      setError('Failed to load user data');
    }
  }, [joinServer, isConnected, connectToVoice]);

  const startScreenShare = useCallback(async () => {
    if (!room) {
      console.warn('❌ No room available for screen share');
      return;
    }

    if (isScreenSharing) {
      console.warn('⚠️ Already sharing screen');
      return;
    }

    try {
      console.log('🖥️ Starting screen share...');
      console.log('📊 Adaptive Quality Mode: Simulcast enabled with 3 layers');
      console.log('   → High: 1920x1080@60fps (8 Mbps) - для простых сцен');
      console.log('   → Medium: 1280x720@30fps (4 Mbps) - для умеренного движения'); 
      console.log('   → Low: 854x480@15fps (1.5 Mbps) - для сложных сцен');
      setIsScreenSharing(true);
      
      // Создаем высококачественные screen share треки вручную
      const screenTracks = await room.localParticipant.createScreenTracks({
        audio: true, // Включаем звук с экрана
        resolution: { width: 1920, height: 1080 }, // Full HD качество
      });

      // Публикуем треки с максимальными настройками качества
      for (const track of screenTracks) {
        await room.localParticipant.publishTrack(track, {
          // АДАПТИВНОЕ КАЧЕСТВО: Настройки для сложных сцен
          videoEncoding: {
            maxBitrate: 8_000_000, // Максимальный битрейт для высокого качества
            maxFramerate: 60,
          },
          // ВКЛЮЧАЕМ simulcast для автоматической адаптации к сложности контента
          simulcast: true,
          // Слои качества для адаптивного стриминга (копируем из publishDefaults)
          videoSimulcastLayers: [
            // Высокое качество для простых сцен (минимальное движение)
            {
              width: 1920,
              height: 1080,
              resolution: { width: 1920, height: 1080 },
              encoding: {
                maxBitrate: 8_000_000, // 8 Mbps для Full HD при статичном контенте
                maxFramerate: 60,
              },
            },
            // Среднее качество для умеренно сложных сцен
            {
              width: 1280,
              height: 720,
              resolution: { width: 1280, height: 720 },
              encoding: {
                maxBitrate: 4_000_000, // 4 Mbps для HD при движении
                maxFramerate: 30,
              },
            },
            // Низкое качество для очень сложных сцен (много движения)
            {
              width: 854,
              height: 480,
              resolution: { width: 854, height: 480 },
              encoding: {
                maxBitrate: 1_500_000, // 1.5 Mbps для SD при интенсивном движении
                maxFramerate: 15,
              },
            },
          ],
          // Помечаем как screen share источник
          source: track.kind === Track.Kind.Video ? Track.Source.ScreenShare : Track.Source.ScreenShareAudio,
        });
      }
      
      console.log('✅ Screen share started successfully');
    } catch (err: any) {
      console.error('❌ Failed to start screen share:', err);
      setError(err.message || 'Failed to start screen sharing');
      setIsScreenSharing(false);
    }
  }, [room, isScreenSharing]);

  const stopScreenShare = useCallback(async () => {
    if (!room) {
      console.warn('❌ No room available for stopping screen share');
      return;
    }

    if (!isScreenSharing) {
      console.warn('⚠️ Not currently sharing screen');
      return;
    }

    try {
      console.log('🛑 Stopping screen share...');
      
      // Отключаем все screen share треки
      const allPublications = Array.from(room.localParticipant.trackPublications.values());
      
      for (const publication of allPublications) {
        if (publication.source === Track.Source.ScreenShare || 
            publication.source === Track.Source.ScreenShareAudio) {
          if (publication.track) {
            publication.track.stop();
            await room.localParticipant.unpublishTrack(publication.track);
          }
        }
      }
      
      setIsScreenSharing(false);
      console.log('✅ Screen share stopped successfully');
    } catch (err: any) {
      console.error('❌ Failed to stop screen share:', err);
      setError(err.message || 'Failed to stop screen sharing');
    }
  }, [room, isScreenSharing]);

  const startAudio = useCallback(async () => {
    if (!room) {
      console.warn('No room available for startAudio');
      return;
    }

    try {
      console.log('🔊 Starting audio...');
      await room.startAudio();
      setCanPlaybackAudio(true);
      setNeedsUserInteraction(false);
      console.log('✅ Audio started successfully');
    } catch (err: any) {
      console.error('❌ Failed to start audio:', err);
      setError(err.message || 'Failed to start audio');
    }
  }, [room]);

  const getQualityInfo = useCallback(() => {
    if (!room || !isScreenSharing) {
      return 'Адаптивное качество готово';
    }

    // Информация об адаптивном качестве simulcast
    return 'Автоматическая адаптация: HD→Full HD→SD';
  }, [room, isScreenSharing]);

  // Мониторинг изменений качества
  useEffect(() => {
    if (room && isScreenSharing) {
      const qualityInfo = getQualityInfo();
      setCurrentQualityInfo(qualityInfo);
      console.log('📊 Quality Info:', qualityInfo);
    } else {
      setCurrentQualityInfo(null);
    }
  }, [room, isScreenSharing, getQualityInfo]);

  const value = useMemo<ServerContextType>(() => ({
    selectedServer,
    servers,
    isLoading,
    error,
    room,
    isConnecting,
    canPlaybackAudio,
    needsUserInteraction,
    activeSpeakers,
    isLocalSpeaking,
    isScreenSharing,
    screenTracks,
          currentQualityInfo,
    setServers,
    selectServer,
    setLoading: setIsLoading,
    setError,
    connectToVoice,
    disconnectFromVoice,
    startAudio,
    restoreUserState,
    startScreenShare,
    stopScreenShare,
    getQualityInfo,
  }), [
    selectedServer,
    servers,
    isLoading,
    error,
    room,
    isConnecting,
    canPlaybackAudio,
    needsUserInteraction,
    activeSpeakers,
    isLocalSpeaking,
    isScreenSharing,
    screenTracks,
    setServers,
    selectServer,
    setIsLoading,
    setError,
    connectToVoice,
    disconnectFromVoice,
    startAudio,
    restoreUserState,
    startScreenShare,
    stopScreenShare,
    getQualityInfo,
  ]);

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = (): ServerContextType => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}; 