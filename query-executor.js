"use strict";

const { remote, ipcRenderer } = require("electron");
const { Pool } = require("pg");

const executorId = require("uuid/v1")();

const connectionConfig = remote.getCurrentWindow().connectionConfig;

const connectionPool = new Pool({
  user: connectionConfig.username,
  host: connectionConfig.host,
  database: "postgres",
  password: connectionConfig.password,
  port: connectionConfig.port
});

// Initialisation completed
ipcRenderer.send("queryExecutor.initialiseConnectionCallback", executorId);

ipcRenderer.on("queryExecutor.runQuery", (event, payload) => {

  if(payload.queryExecutorId === executorId) {
    connectionPool.query(payload.query, (err, res) => {

      console.log(err, res);
  
      if(err !== undefined) {
        // The IPC payload is serialised to JSON beofre transmisison, so the protoype chain is lost.
        // So store the nicely formatted error message as a property.
        err.cause = err.toString();
      }

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
    "SELECT c.table_schema || '.' || c.table_name identifier, c.column_name " +
    "FROM information_schema.columns c " +
    "WHERE c.table_schema != 'pg_catalog'";

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