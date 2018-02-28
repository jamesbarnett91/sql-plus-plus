"use strict";

const { remote, ipcRenderer } = require("electron");
const { Pool } = require("pg");

const connectionTestQuery = "SELECT now()";

const executorId = remote.getCurrentWindow().executorId;

const connectionConfig = remote.getCurrentWindow().connectionConfig;

const connectionPool = new Pool({
  user: connectionConfig.username,
  host: connectionConfig.host,
  database: connectionConfig.database,
  password: connectionConfig.password,
  port: connectionConfig.port
});

// Test the newly initialised connection
connectionPool.query(connectionTestQuery, (err, res) => {
  setErrorCauseIfExists(err);
  ipcRenderer.send("queryExecutor.initialiseConnectionCallback", {error: err, executorId: executorId});
});

function setErrorCauseIfExists(error) {
  if (error !== undefined) {
    // The IPC payload is serialised to JSON before transmission, so the prototype chain is lost.
    // So store the nicely formatted error message as a property.
    error.cause = error.toString();
  }
}

ipcRenderer.on("queryExecutor.runQuery", (event, payload) => {

  if(payload.queryExecutorId === executorId) {
    connectionPool.query(payload.query, (err, res) => {

      console.log(err, res);
  
      setErrorCauseIfExists(err);

      ipcRenderer.send("queryExecutor.runQueryComplete", {
        "error": err,
        "result": res,
        "editorInstanceId": payload.editorInstanceId
      });
  
    });
  }
  
});

ipcRenderer.on("queryExecutor.queryTableMetadata", (event, payload) => {

  let tableMetadata = {};

  let tableDataQuery = 
    "SELECT c.table_name identifier, c.column_name " +
    "FROM information_schema.columns c " +
    "WHERE c.table_schema = current_schema()";

  connectionPool.query(tableDataQuery, (err, res) => {

    console.log(err, res)

    res.rows.forEach((row) => {
      if(tableMetadata.hasOwnProperty(row.identifier)) {
        tableMetadata[row.identifier].push(row.column_name);
      }
      else {
        tableMetadata[row.identifier] = [row.column_name];
      }
    })

    ipcRenderer.send("queryExecutor.queryTableMetadataComplete", {
      "error": err,
      "result": tableMetadata,
      "editorInstanceId": payload.editorInstanceId
    });

  });

});