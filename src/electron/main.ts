import { app, BrowserWindow, ipcMain, nativeImage, Menu } from 'electron';
import * as path from 'path';
import { createBackend } from '../backend';

let mainWindow: BrowserWindow | null = null;
const shouldOpenDevTools = process.argv.includes('--devtools') || process.argv.includes('--console');

app.setName('Notegit');
app.name = 'Notegit';

const createAppMenu = () => {
  const menu = Menu.buildFromTemplate([
    {
      label: app.getName(),
      submenu: [{ role: 'close' }],
    },
  ]);
  Menu.setApplicationMenu(menu);
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/index.html'));
  }

  if (process.env.NODE_ENV === 'development' || shouldOpenDevTools) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    app.setName('Notegit');
    app.name = 'Notegit';
    app.setAboutPanelOptions({ applicationName: 'Notegit' });
    createAppMenu();
    if (process.platform === 'darwin' && !app.isPackaged) {
      const iconPath = path.join(app.getAppPath(), 'src', 'electron', 'resources', 'notegit.png');
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        app.dock.setIcon(icon);
      }
    }

    createBackend(ipcMain);
    
    ipcMain.handle('app:restart', () => {
      app.relaunch();
      app.quit();
    });
    
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
