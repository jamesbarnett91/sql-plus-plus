const { app, BrowserWindow, ipcMain } = require('electron');

const path = require("path");
const url = require("url");

let uiWindow;
let newConnectionDialog;
let queryExecutors = [];

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

app.on("ready", () => {
  createMainWindow();
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
    height: 540
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

function createQueryExecutor(payload) {
  let executor = new BrowserWindow({
    show: false,
  });
  
  executor.connectionConfig = payload;
  
  executor.loadURL(url.format({
    pathname: path.join(__dirname, "./query-executor-wrapper.html"),
    protocol: "file:",
    slashes: true
  }));

  queryExecutors.push(executor);

  return executor;
}

ipcMain.on("newConnection.createConnection", (event, payload) => {
  createQueryExecutor(payload);
});


ipcMain.on("queryExecutor.initialiseConnectionCallback", (event, executorId) => {
  // TODO - handle connection initialisation errors
  
  // Bit of a hack, cant guarantee this was the executor which just got initalised.executor
  // Should pass it back from the executor via the payload
  let connectionName = queryExecutors[queryExecutors.length -1].connectionConfig.name;

  uiWindow.webContents.send("instanceManager.registerNewInstance", {assignedQueryExecutorId: executorId, connectionName: connectionName});
  newConnectionDialog.close();
});


const { webContents } = require('electron');

// TODO - only send messages to instance manager which will route request to correct webView, rather than 
// sending to all webViews
ipcMain.on("queryExecutor.runQueryComplete", (event, payload) => {
  webContents.getAllWebContents().forEach((w) => {
    w.send("queryExecutor.runQueryComplete", payload);
  })
});

ipcMain.on("queryExecutor.runQuery", (event, payload) => {
  queryExecutors.forEach((executor) => {
    executor.webContents.send("queryExecutor.runQuery", payload);
  });
});

ipcMain.on("queryExecutor.queryTableMetadataComplete", (event, payload) => {
  webContents.getAllWebContents().forEach((w) => {
    w.send("queryExecutor.queryTableMetadataComplete", payload);
  })
});
;
ipcMain.on("queryExecutor.queryTableMetadata", (event, payload) => {
  queryExecutors.forEach((executor) => {
    executor.webContents.send("queryExecutor.queryTableMetadata", payload);
  });
});