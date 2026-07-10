import { app, BrowserWindow, ipcMain, Menu, shell, dialog, nativeImage, Tray } from 'electron';

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!isDev) {
  process.env.NODE_ENV = 'production';
}

let mainWindow;
let tray = null;
let isQuitting = false;

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'reload', label: 'Refresh', accelerator: 'F5' },
      { role: 'forceReload', label: 'Force Refresh', accelerator: 'CmdOrCtrl+Shift+R' },
      { type: 'separator' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { role: 'resetZoom' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      { type: 'separator' },
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Visit bright-uae.com',
        click: () => {
          shell.openExternal('https://bright-uae.com');
        }
      },
      { type: 'separator' },
      {
        label: 'About Stock Master',
        click: () => {
          dialog.showMessageBox({
            type: 'info',
            title: 'About Stock Master',
            message: 'Stock Master',
            detail: 'Developed by Bright Solution for managing Stock efficiently.\n\nhttps://bright-uae.com'
          });
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

app.setAppUserModelId("com.stockmaster.uae");

// Use direct path for Windows (more reliable than nativeImage inside asar)
const iconPath = path.join(app.getAppPath(), 'build', 'CD_Logo.png');

function createWindow() {
  console.log('Resolved preload path:', path.join(__dirname, 'preload.js'));
  console.log('Resolved preload path:', path.join(app.getAppPath(), 'preload.js'));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  const port = process.env.PORT || 5000;
  mainWindow.loadURL(isDev ? `http://localhost:5173` : `http://localhost:${port}`);

  // Duplicate window creation removed – original createWindow with appIcon retained
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (url !== currentUrl) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  console.log('Starting internal server...');

  try {
    await import('./server/server.js');
  } catch (err) {
    console.error('Failed to start internal server:', err);
  }
}

app.on('ready', async () => {
  await startServer();

  setTimeout(() => {
    createWindow();

    // System Tray Setup
    try {
      tray = new Tray(iconPath);
    } catch (e) {
      tray = new Tray(nativeImage.createEmpty());
    }

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Stock Master', click: () => { if (mainWindow) mainWindow.show(); } },
      { type: 'separator' },
      {
        label: 'Quit Server completely', click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('Stock Master Server (Running on LAN)');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) mainWindow.show();
    });

  }, 2000);

});

app.on('window-all-closed', () => {
  if (isQuitting && process.platform !== 'darwin') {
    app.quit();
  }
});
