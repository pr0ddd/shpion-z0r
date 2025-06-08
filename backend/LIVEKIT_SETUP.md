# 🎙️ LiveKit Integration Setup

Это руководство поможет настроить LiveKit для голосового и видео чата в Shpion.

## 🚀 Быстрый старт

### 1. Переменные окружения

Добавьте в ваш `.env` файл:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=http://localhost:7880
LIVEKIT_WS_URL=ws://localhost:7880
```

### 2. Запуск LiveKit сервера

Для локальной разработки запустите LiveKit через Docker:

```bash
# Запуск LiveKit сервера
docker-compose -f docker-compose.livekit.yml up -d

# Проверка статуса
docker-compose -f docker-compose.livekit.yml ps

# Логи
docker-compose -f docker-compose.livekit.yml logs -f livekit
```

### 3. Проверка подключения

После запуска LiveKit будет доступен:
- **API**: http://localhost:7880
- **WebSocket**: ws://localhost:7880
- **gRPC**: localhost:7881

## 📋 API Endpoints

### Голосовой чат

```http
# Получить токен для подключения к голосовому чату
POST /api/livekit/voice/:serverId/token
Authorization: Bearer <jwt_token>

# Покинуть голосовой чат
POST /api/livekit/voice/:serverId/leave
Authorization: Bearer <jwt_token>

# Получить статус голосового чата
GET /api/livekit/voice/:serverId/status
Authorization: Bearer <jwt_token>
```

### Стримы

```http
# Получить токен для подключения к стриму
POST /api/livekit/stream/:streamId/token
Authorization: Bearer <jwt_token>
```

## 🧪 Тестирование

### 1. Создайте тестовый сервер и получите токен

```bash
# Создайте сервер (если ещё не создан)
curl -X POST http://localhost:3001/api/servers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test Voice Server","description":"Testing voice chat"}'

# Получите токен для голосового чата
curl -X POST http://localhost:3001/api/livekit/voice/YOUR_SERVER_ID/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Проверьте ответ

Успешный ответ будет содержать:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "wsUrl": "ws://localhost:7880"
  },
  "message": "Voice token generated successfully"
}
```

## 🔧 Конфигурация

### LiveKit Configuration (`livekit.yaml`)

Основные настройки:
- **Порт API**: 7880
- **gRPC порт**: 7881
- **WebRTC порты**: 50000-60000
- **Автоудаление комнат**: 5 минут после выхода последнего участника

### Production настройки

Для продакшна рекомендуется:

1. **Использовать LiveKit Cloud** вместо self-hosted
2. **Настроить TURN сервер** для работы за NAT
3. **Использовать SSL** для WebSocket подключений
4. **Настроить webhook'и** для отслеживания событий

```env
# Production LiveKit Cloud
LIVEKIT_URL=https://your-project.livekit.cloud
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_production_key
LIVEKIT_API_SECRET=your_production_secret
```

## 🐛 Отладка

### Общие проблемы

1. **Сервер не запускается**
   ```bash
   # Проверьте порты
   netstat -tlnp | grep 7880
   
   # Проверьте Docker
   docker logs livekit-livekit-1
   ```

2. **Ошибки подключения WebRTC**
   - Убедитесь что порты 50000-60000 открыты
   - Проверьте настройки STUN серверов
   - Для локальной разработки используйте `localhost` вместо `127.0.0.1`

3. **Токены не работают**
   - Проверьте API ключи в `.env`
   - Убедитесь что время сервера синхронизировано

### Логи

```bash
# Включить debug логи в livekit.yaml
logging:
  level: debug

# Перезапустить контейнер
docker-compose -f docker-compose.livekit.yml restart livekit
```

## 🎯 Frontend интеграция

После настройки backend, для frontend используйте:

```bash
npm install @livekit/components-react livekit-client
```

Компоненты React:
- `VideoConference` - готовый интерфейс
- `AudioConference` - только аудио
- `useRoom`, `useTracks` - хуки для кастомизации

## 📚 Полезные ссылки

- [LiveKit Documentation](https://docs.livekit.io)
- [React Components](https://github.com/livekit/components-js)
- [LiveKit Cloud](https://livekit.io/cloud)
- [Example Apps](https://github.com/livekit-examples) 