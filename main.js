const { app, BrowserWindow, ipcMain } = require('electron');

const path = require("path");
const url = require("url");

let uiWindow;
let queryExecutorProcess;
let newConnectionDialog;

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

function createNewConnectionDialog() {
  newConnectionDialog = new BrowserWindow({
    width: 400,
    height: 470
  });
  newConnectionDialog.loadURL(url.format({
    pathname: path.join(__dirname, "new-connection.html"),
    protocol: "file:",
    slashes: true
  }));

  newConnectionDialog.on("closed", () => {
    newConnectionDialog = null;
  });
}

ipcMain.on("instanceManager.openNewConnectionDialog", (event, payload) => {
  createNewConnectionDialog();
});


const { webContents } = require('electron');

// TODO - only send messages to instance manager which will route request to correct webView, rather than 
// sending to all webViews
ipcMain.on("queryExecutor.runQueryComplete", (event, payload) => {
  webContents.getAllWebContents().forEach((w) => {
    w.send("queryExecutor.runQueryComplete", payload);
  })
});
ipcMain.on("queryExecutor.runQuery", (event, payload) => queryExecutorProcess.webContents.send("queryExecutor.runQuery", payload));

ipcMain.on("queryExecutor.queryTableMetadataComplete", (event, payload) => {
  webContents.getAllWebContents().forEach((w) => {
    w.send("queryExecutor.queryTableMetadataComplete", payload);
  })
});
ipcMain.on("queryExecutor.queryTableMetadata", (event, payload) => queryExecutorProcess.webContents.send("queryExecutor.queryTableMetadata", payload));