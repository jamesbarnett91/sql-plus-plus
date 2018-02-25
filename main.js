const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require("path");
const url = require("url");
const Store = require("electron-store");
const uuid = require('uuid/v1');

const connectionStore = new Store();
let uiWindow;
let newConnectionDialog;
let queryExecutors = [];
let savedConnections = [];

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
  restoreSavedConnections();
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
    height: 600
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
  executor.executorId = uuid();

  console.log("created executor with id:" + executor.executorId);
  
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


ipcMain.on("queryExecutor.initialiseConnectionCallback", (event, payload) => {
  
  if (payload.error !== undefined) {
    console.log(payload.error);
    destroyQueryExecutor(payload.executorId);
    newConnectionDialog.webContents.send("newConnection.initialisationFailed", payload.error);
  }
  else {
    let connectionConfig = getQueryExecutorInstance(payload.executorId).connectionConfig;

    if(connectionConfig.isTest) {
      newConnectionDialog.webContents.send("newConnection.connectionTestOk");
      destroyQueryExecutor(payload.executorId);
    }
    else {
      uiWindow.webContents.send("instanceManager.registerNewInstance", { assignedQueryExecutorId: payload.executorId, connectionConfig: connectionConfig });
      
      persistConnection(connectionConfig);

      // The connection dialog wont exist if this executor was restored on app start
      if (newConnectionDialog) {
        newConnectionDialog.close();
      }
      
    }
  }
  
});

function getQueryExecutorInstance(executorId) {
  return queryExecutors.find((e) => {
    return e.executorId === executorId;
  });
}

function destroyQueryExecutor(executorId) {
  let executor = getQueryExecutorInstance(executorId);
  executor.close();
  let i = queryExecutors.indexOf(executor);
  if(i !== -1) {
    queryExecutors.splice(i, 1);
  }
}

function persistConnection(connectionConfig) {
  savedConnections.push(connectionConfig);
  connectionStore.set(savedConnections);
}

function restoreSavedConnections() {
  for (let connection of connectionStore) {
    console.log("restoring connection:");
    console.log(connection[1]);
    createQueryExecutor(connection[1]);
  }
  
  if (connectionStore.size === 0) {
    createNewConnectionDialog();
  }
}

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