# DeepFilterNet3 Models Directory

## 📁 Размещение модели DeepFilterNet3

Эта папка предназначена для хранения предобученных моделей DeepFilterNet для подавления шума в реальном времени.

## 🚀 Быстрый старт

### Вариант 1: Скачать готовую модель
```bash
# Скачиваем официальную модель DeepFilterNet3 (~8MB)
curl -L -o DeepFilterNet3.tar.gz \
  "https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/DeepFilterNet3.tar.gz"
```

### Вариант 2: Использовать другие модели
```bash
# DeepFilterNet2 (для слабых устройств, ~2MB)
curl -L -o DeepFilterNet2.tar.gz \
  "https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/DeepFilterNet2.tar.gz"

# DeepFilterNet (оригинальная модель, ~6MB)
curl -L -o DeepFilterNet.tar.gz \
  "https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/DeepFilterNet.tar.gz"
```

## 🎯 Поддерживаемые форматы

Загрузчик модели поддерживает следующие имена файлов:
- `DeepFilterNet3.tar.gz` (рекомендуется)
- `deepfilter3.tar.gz` 
- `default.tar.gz`

## 🔧 Структура после установки

```
apps/frontend/public/models/
├── README.md                    # Эта инструкция
├── DeepFilterNet3.tar.gz       # Основная модель (8MB)
├── DeepFilterNet2.tar.gz       # Легкая версия (2MB) 
└── DeepFilterNet.tar.gz        # Оригинальная (6MB)
```

## ⚡ Автоматическая загрузка

Если модель не найдена локально, система попытается загрузить её автоматически с GitHub:
- ✅ Автоматический fallback на GitHub releases
- ✅ Кеширование загруженной модели
- ✅ Graceful degradation (passthrough режим если модель не загрузилась)

## 🎤 Характеристики моделей

| Модель | Размер | Качество | Производительность | Рекомендация |
|--------|--------|----------|-------------------|--------------|
| **DeepFilterNet3** | ~8MB | ⭐⭐⭐⭐⭐ | Средняя | **Лучший выбор** |
| DeepFilterNet2 | ~2MB | ⭐⭐⭐⭐ | Высокая | Для слабых устройств |
| DeepFilterNet | ~6MB | ⭐⭐⭐ | Средняя | Базовая версия |

## 🔍 Проверка установки

После размещения модели:

1. Откройте консоль разработчика (F12)
2. Включите DeepFilter в настройках звука
3. Должны появиться сообщения:
   ```
   🎤 DeepFilter: Загружаем модель...
   🎤 DeepFilter: Модель загружена (8123456 байт)
   🎤 DeepFilterNet: Инициализирован, frame_length=480
   ```

## ⚠️ Важные примечания

- Модели работают только по **HTTPS** (требование WebAssembly)
- Первая загрузка может занять **3-5 секунд**
- Модель кешируется в памяти после первой загрузки
- Если модель повреждена, удалите файл и перезагрузите

## 🐛 Устранение проблем

### Модель не загружается
```bash
# Проверьте размер файла
ls -la DeepFilterNet3.tar.gz

# Должно быть ~8MB (8123456 байт)
# Если меньше - файл поврежден, перезагрузите
```

### Ошибка CORS
- Убедитесь что работаете по `http://localhost` или `https://`
- Модель должна быть в папке `public/models/`

### Низкая производительность
- Попробуйте DeepFilterNet2 (меньше ресурсов)
- Уменьшите качество звука в настройках LiveKit

## 📖 Дополнительная информация

- [DeepFilterNet GitHub](https://github.com/Rikorose/DeepFilterNet)
- [Документация WebAssembly](https://webassembly.org/)
- [AudioWorklet API](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) 