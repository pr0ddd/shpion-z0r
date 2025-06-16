const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Создаем окно браузера.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      // Изолируем контекст для безопасности.
      contextIsolation: true,
      // Отключаем интеграцию с Node.js в рендерере.
      nodeIntegration: false,
      // Подключаем наш preload скрипт
      preload: path.join(__dirname, 'preload-main.js'),
    },
  });

  // Убираем стандартное меню.
  mainWindow.setMenu(null);

  // и загружаем в него React-приложение.
  // Во время разработки мы будем загружать его с dev-сервера.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Открываем DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    // В продакшене мы будем загружать собранный файл.
    mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));
  }
}

// Этот метод будет вызван, когда Electron закончит
// инициализацию и будет готов к созданию окон.
app.whenReady().then(() => {
  // Устанавливаем обработчик для запросов getDisplayMedia
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
        return callback();
    }

    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async (sources) => {
        
        // Отправляем источники в рендерер для отображения
        mainWindow.webContents.send('show-source-picker', sources.map(s => ({id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL()})));

        // Ждем ответа от рендерера
        ipcMain.once('source-picker-selection', (event, id) => {
            if (!id) {
                // Пользователь отменил выбор
                return callback();
            }
            const selectedSource = sources.find((source) => source.id === id);
            if (selectedSource) {
                callback({ video: selectedSource, audio: 'loopback' });
            } else {
                callback();
            }
        });
    }).catch(err => {
        console.error('Не удалось получить источники:', err);
        callback();
    });
  });

  createWindow();

  app.on('activate', () => {
    // На macOS принято заново создавать окно в приложении,
    // когда значок в доке был нажат, и нет других открытых окон.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Выход из приложения, когда все окна закрыты, кроме macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 