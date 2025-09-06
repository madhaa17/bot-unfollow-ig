const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { runUnfollowBot } = require("./app");

let mainWindow;

// Add command line switches BEFORE app is ready to fix sandbox issues on Linux
app.commandLine.appendSwitch("--no-sandbox");
app.commandLine.appendSwitch("--disable-setuid-sandbox");
app.commandLine.appendSwitch("--disable-dev-shm-usage");
app.commandLine.appendSwitch("--disable-accelerated-2d-canvas");
app.commandLine.appendSwitch("--disable-gpu");
app.commandLine.appendSwitch("--disable-web-security");
app.commandLine.appendSwitch("--disable-features=VizDisplayCompositor");
app.commandLine.appendSwitch("--disable-background-timer-throttling");
app.commandLine.appendSwitch("--disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("--disable-renderer-backgrounding");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true, // Enable window frame for better usability
    transparent: false, // Disable transparency for better visibility
    resizable: true, // Enable resizing for better user experience
    focusable: true, // Enable focus so inputs can be typed
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Handle window controls
ipcMain.on("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window:close", () => {
  if (mainWindow) mainWindow.close();
});

// App Ready
app.whenReady().then(() => {
  // Disable security warnings for development
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("start-bot", async (event, { username, password, limit }) => {
  try {
    // Log callback function to send logs to renderer
    const logCallback = (log) => {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send("bot-log", log);
      }
    };

    const unfollowed = await runUnfollowBot(
      username,
      password,
      limit,
      logCallback
    );

    return {
      status: "success",
      message: `Bot finished successfully for ${username}`,
      unfollowed: unfollowed,
    };
  } catch (error) {
    const errorMessage = `❌ Error: ${error.message}`;
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("bot-log", errorMessage);
    }
    return {
      status: "error",
      message: error.message || error.toString(),
      unfollowed: 0,
    };
  }
});
