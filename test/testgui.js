const { app, BrowserWindow, Menu, screen } = require("electron");
const path = require("path");

function createWindow() {
  const { height, width } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: parseInt((width/2)-5),
    height: parseInt(height-10),
    webPreferences: {
        nodeIntegration: true,  // <<< ini yang penting
        contextIsolation: false, // <<< ini juga (biar require bisa langsung di renderer)
        preload: path.join(__dirname, '..', "dist", 'gbUI.js')
    }
  });
  const customMenu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }             // Keluar aplikasi
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },          // Reload biasa
        { role: 'forcereload' },     // Force reload (bypass cache)
        { type: 'separator' },
        { role: 'togglefullscreen' }, // F11
        { type: 'separator' },
        { role: 'zoomin' },           // Ctrl+Plus
        { role: 'zoomout' },          // Ctrl+Minus
        { role: 'resetzoom' }         // Ctrl+0
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          //click: () => {
          //  console.log("Show about dialog");
          //}
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(customMenu);
  // Karena main.js ada di test/, harus naik dulu ke project/
  win.loadFile(path.join(__dirname, '..', 'templates', 'index.html')).then(() => {
    win.webContents.setZoomFactor(0.8); // Set zoom ke 90%
  });
  win.webContents.on("before-input-event", (event, input) => {
    if (input.control || input.meta) {
      if (["I", "J", "C", "U", "P"].includes(input.key.toUpperCase())) {
        event.preventDefault(); // Ctrl+Shift+I / Ctrl+U / Ctrl+Shift+J  / Ctrl+P
      }
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
