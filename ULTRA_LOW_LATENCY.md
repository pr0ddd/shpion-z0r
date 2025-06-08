# 🚀 УЛЬТРА-НИЗКАЯ ЗАДЕРЖКА ГОЛОСОВОГО ЧАТА

## 🔧 Настройки браузера для минимальной задержки

### Chrome (Рекомендуется)
Запустите Chrome с флагами низкой задержки:

```bash
chrome --enable-features=WebRtcHideLocalIpsWithMdns,WebRtcUseEchoCanceller3 \
       --disable-features=WebRtcHybridAgc \
       --force-fieldtrials="WebRTC-Audio-MinimizeResamplingOnMobile/Enabled/" \
       --disable-background-timer-throttling \
       --disable-backgrounding-occluded-windows \
       --disable-renderer-backgrounding \
       --max_old_space_size=4096
```

### Firefox
Откройте `about:config` и установите:
- `media.navigator.mediadataencoder_vpx_enabled` → `false`
- `media.peerconnection.ice.force_interface` → ваш IP
- `media.webaudio.latency_hints` → `true`

## ⚙️ Настройки системы

### Windows
1. **Настройки энергосбережения:**
   - Панель управления → Электропитание → "Высокая производительность"

2. **Настройки аудио:**
   - Панель управления → Звук → вкладка "Запись"
   - Выберите микрофон → Свойства → "Дополнительно"
   - Снимите "Обработка сигналов"
   - Установите "16 бит, 48000 Гц"

3. **Отключите ненужные службы:**
   ```cmd
   sc config "Windows Update" start=disabled
   sc config "Windows Search" start=disabled
   ```

### Linux
```bash
# Настройка PulseAudio для низкой задержки
echo "default-sample-rate = 48000" >> ~/.pulse/daemon.conf
echo "alternate-sample-rate = 48000" >> ~/.pulse/daemon.conf
echo "default-fragments = 2" >> ~/.pulse/daemon.conf
echo "default-fragment-size-msec = 5" >> ~/.pulse/daemon.conf
pulseaudio -k && pulseaudio --start
```

## 🌐 Настройки сети

### Оптимизация сетевого стека
```bash
# Linux
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_congestion_control = bbr' >> /etc/sysctl.conf
sysctl -p
```

### QoS настройки роутера
- Приоритет для UDP трафика: **Высокий**
- Порты: 50000-60000 (WebRTC)
- DSCP маркировка: AF41 или EF

## 📊 Мониторинг производительности

### Проверка задержки в браузере
Откройте DevTools → Console и выполните:

```javascript
// Проверка AudioContext латентности
const ctx = new AudioContext();
console.log('Base latency:', ctx.baseLatency * 1000, 'ms');
console.log('Output latency:', ctx.outputLatency * 1000, 'ms');

// Мониторинг WebRTC статистики
setInterval(async () => {
  const stats = await pc.getStats();
  stats.forEach(stat => {
    if (stat.type === 'media-source' && stat.kind === 'audio') {
      console.log('Audio delay:', stat.totalAudioEnergy);
    }
  });
}, 1000);
```

## 🎯 Ожидаемые результаты

### Оптимальные показатели:
- **Задержка захвата аудио:** < 10ms
- **Сетевая задержка:** < 20ms (локальная сеть)
- **Задержка воспроизведения:** < 5ms
- **Общая задержка:** < 35ms

### Компромиссы:
- ❌ Отключены шумоподавление и эхоподавление
- ❌ Возможны артефакты при плохой связи  
- ❌ Повышенное использование CPU/батареи
- ✅ Минимальная задержка
- ✅ Натуральный звук голоса

## 🔍 Диагностика проблем

### Проверьте в DevTools Console:
```
🔊 Audio Context latency: X ms  // Должно быть < 10ms
🎤 Microphone enabled with ULTRA low-latency settings
🔊 Audio track attached with ULTRA low-latency settings
```

### Высокая задержка? Проверьте:
1. **Процессор нагружен** → Закройте лишние приложения
2. **Медленная сеть** → Проверьте ping
3. **Устаревшие драйверы аудио** → Обновите
4. **Антивирус блокирует** → Добавьте в исключения
5. **Wi-Fi вместо Ethernet** → Используйте кабель

## 🚨 Экстремальный режим

Для максимально низкой задержки (< 20ms):

1. **Прямое подключение Ethernet**
2. **Отключите Wi-Fi полностью**
3. **Закройте ВСЕ лишние приложения**
4. **Используйте выделенные аудио устройства**
5. **Запустите LiveKit на том же компьютере**

### Локальный LiveKit для тестирования:
```bash
livekit-server --config livekit.yaml --bind 127.0.0.1
```

Измените в `backend/.env`:
```
LIVEKIT_URL=ws://127.0.0.1:7880
```

---

**⚡ Результат:** Задержка голоса как в телефонном разговоре (~15-25ms)! 