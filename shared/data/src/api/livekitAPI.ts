import { ApiResponse } from '@shared/types';
import http from './';

// --- LiveKit ---
export const livekitAPI = {
  /**
   * Запрашивает токен для подключения к голосовой/видеокомнате.
   * @param serverId  ID выбранного сервера
   * @param instance  Необязательный индекс «виртуального» участника для дополнительных экранов.
   */
  getVoiceToken: (serverId: string, instance?: number) => {
    const query = instance !== undefined ? `?instance=${instance}` : '';
    return http
      .get<ApiResponse<{ token: string }>>(
        `/livekit/voice/${serverId}/token${query}`
      )
      .then((res) => res.data);
  },
};
