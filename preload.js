const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    restore: () => ipcRenderer.send('restore-window'),
    fullscreen: () => ipcRenderer.send('fullscreen-window'),
    close: () => ipcRenderer.send('close-window'),
    openPage: (pageName) => ipcRenderer.invoke('load-page', pageName),
    updateMoney: () => ipcRenderer.invoke('update-money'),
    tryConnect: (to, time) => ipcRenderer.invoke('connect-server', to, time),
    setConnectionStatus: (callback) => ipcRenderer.on('setConnectionStatus', (event, connection, status) => callback(connection, status)),
    tryLogin: (pass) => ipcRenderer.invoke('try-login', pass),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
});