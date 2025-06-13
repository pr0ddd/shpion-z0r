const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Main -> Renderer
  onShowSourcePicker: (callback) => ipcRenderer.on('show-source-picker', (_event, sources) => callback(sources)),
  
  // Renderer -> Main
  sendSourceSelection: (id) => ipcRenderer.send('source-picker-selection', id),

  // Cleanup
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 