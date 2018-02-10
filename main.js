const { app, BrowserWindow, ipcMain } = require('electron');

const path = require("path");
const url = require("url");

let uiWindow;
let queryExecutorProcess;

function createMainWindow() {
  uiWindow = new BrowserWindow({
    width: 800,
    height: 600
  });
  uiWindow.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }));

  uiWindow.on("closed", () => {
    uiWindow = null;
    app.quit();
  });
}

function createQueryExecutorProcess() {
  queryExecutorProcess = new BrowserWindow({
    show: false
  });

  queryExecutorProcess.loadURL(url.format({
    pathname: path.join(__dirname, "./query-executor-wrapper.html"),
    protocol: "file:",
    slashes: true
  }));

  queryExecutorProcess.on("closed", () => {
    queryExecutorProcess = null;
  });

}

app.on("ready", () => {
  createMainWindow();
  createQueryExecutorProcess();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (uiWindow === null) {
    createWindow();
  }
});

ipcMain.on("queryExecutor.runQueryComplete", (event, payload) => uiWindow.webContents.send("queryExecutor.runQueryComplete", payload));
ipcMain.on("queryExecutor.runQuery", (event, payload) => queryExecutorProcess.webContents.send("queryExecutor.runQuery", payload));