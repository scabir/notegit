import { app, BrowserWindow, ipcMain, nativeImage, Menu, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import { createBackend } from '../backend';

let mainWindow: BrowserWindow | null = null;
const buildWindowTitle = () => `notegit - ${app.getVersion()}`;
const SOURCE_CODE_URL = 'https://github.com/scabir/notegit';
const USER_GUIDE_URL = `${SOURCE_CODE_URL}/blob/main/USER_GUIDE.md`;

const sendMenuCommand = (channel: 'menu:open-shortcuts' | 'menu:open-about') => {
  mainWindow?.webContents.send(channel);
};

const buildAppMenu = (): MenuItemConstructorOptions[] => {
  const helpMenu: MenuItemConstructorOptions = {
    label: 'Help',
    submenu: [
      {
        label: 'User Guide',
        click: () => {
          void shell.openExternal(USER_GUIDE_URL);
        },
      },
      {
        label: 'Shortcuts',
        click: () => sendMenuCommand('menu:open-shortcuts'),
      },
      {
        label: 'Source Code',
        click: () => {
          void shell.openExternal(SOURCE_CODE_URL);
        },
      },
      { type: 'separator' },
      {
        label: 'About',
        click: () => sendMenuCommand('menu:open-about'),
      },
    ],
  };

  return [
    ...(process.platform === 'darwin' ? ([{ role: 'appMenu' }] as MenuItemConstructorOptions[]) : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    helpMenu,
  ];
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: buildWindowTitle(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.setTitle(buildWindowTitle());
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow?.setTitle(buildWindowTitle());
  });

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
    if (process.platform === 'darwin' && !app.isPackaged) {
      const iconPath = path.join(app.getAppPath(), 'src', 'electron', 'resources', 'notegit.png');
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        app.dock.setIcon(icon);
      }
    }

    createBackend(ipcMain);
    Menu.setApplicationMenu(Menu.buildFromTemplate(buildAppMenu()));
    
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
