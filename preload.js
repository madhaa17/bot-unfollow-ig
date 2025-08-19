const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("botAPI", {
  startBot: (username, password, limit) =>
    ipcRenderer.invoke("start-bot", { username, password, limit }),
  onBotLog: (callback) => ipcRenderer.on("bot-log", (_, log) => callback(log)),
});
