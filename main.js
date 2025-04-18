const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

let flaskProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    }
  });

  win.loadURL('http://127.0.0.1:5000');
  win.webContents.openDevTools(); // ช่วย Debug ได้ง่าย
}

function waitForFlask(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.on('connect', () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Flask did not start in time'));
        } else {
          setTimeout(check, 500);
        }
      });
    };

    check();
  });
}

app.whenReady().then(async () => {
  flaskProcess = spawn('python', ['backend/app.py'], {
    cwd: __dirname,
    shell: true,
  });

  flaskProcess.stdout.on('data', data => console.log(`Flask: ${data}`));
  flaskProcess.stderr.on('data', data => console.error(`Flask error: ${data}`));

  try {
    await waitForFlask(5000);
    createWindow();
  } catch (err) {
    console.error('Flask did not start in time:', err);
  }
});

app.on('window-all-closed', () => {
  if (flaskProcess) flaskProcess.kill();
  app.quit();
});
