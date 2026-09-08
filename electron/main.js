const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess = null;
const PORT = process.env.PORT || 8088;
const LOCAL_URL = `http://localhost:${PORT}`;
// Can be set to Vercel production URL once deployed
const VERCEL_URL = process.env.VERCEL_URL || '';

function isServerRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerRunning(url)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    try {
      const isWin = process.platform === 'win32';
      const npxCmd = isWin ? 'npx.cmd' : 'npx';
      
      serverProcess = spawn(npxCmd, ['next', 'start', '-p', String(PORT)], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'inherit',
        shell: true
      });

      serverProcess.on('error', (err) => {
        console.error('Failed to start Next.js process:', err);
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function createMainWindow(targetUrl) {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: 'Keuangan Busdev 2026',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(targetUrl);

  // Open external links in real default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'Aplikasi',
      submenu: [
        { label: 'Muat Ulang (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
        { label: 'Layar Penuh (Full Screen)', accelerator: 'F11', click: () => mainWindow && mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Keluar', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Tampilan',
      submenu: [
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Perbesar' },
        { role: 'zoomOut', label: 'Perkecil' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Alat Pengembang (DevTools)' },
      ],
    },
    {
      label: 'Bantuan',
      submenu: [
        {
          label: 'Tentang Keuangan Busdev',
          click: () => {
            shell.openExternal('https://github.com/begolo12/keuangan-busdev');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  const alreadyRunning = await isServerRunning(LOCAL_URL);
  
  if (!alreadyRunning) {
    console.log(`Starting local Next.js server on ${LOCAL_URL}...`);
    await startNextServer();
    const ready = await waitForServer(LOCAL_URL, 20000);
    if (ready) {
      createMainWindow(LOCAL_URL);
    } else if (VERCEL_URL) {
      console.log(`Local server timeout, falling back to Vercel: ${VERCEL_URL}`);
      createMainWindow(VERCEL_URL);
    } else {
      createMainWindow(LOCAL_URL);
    }
  } else {
    createMainWindow(LOCAL_URL);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(LOCAL_URL);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
      } else {
        serverProcess.kill();
      }
    } catch (e) {}
  }
});
