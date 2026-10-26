/**
 * Agent Veto — Native Windows / macOS Electron Desktop Wrapper
 * To package as a standalone offline Windows .exe installer:
 *   npm install --save-dev electron electron-builder
 *   npx electron-builder --win --x64
 */
const { app, BrowserWindow, globalShortcut, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createVetoDesktopWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'Agent Veto — Autonomous AI Desktop Agent',
    backgroundColor: '#070A11',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const targetUrl = process.env.VETO_DESKTOP_URL || 'http://localhost:3000';
  mainWindow.loadURL(targetUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createVetoDesktopWindow();

  // Register global Alt+V shortcut to bring Agent Veto to foreground
  globalShortcut.register('Alt+V', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
