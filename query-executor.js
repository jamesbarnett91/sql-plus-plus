"use strict";

const { ipcRenderer } = require("electron");
const { Pool } = require("pg");

const connectionPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "",
  port: 5432
});

ipcRenderer.on("queryExecutor.runQuery", (event, payload) => {

  connectionPool.query(payload, (err, res) => {

    console.log(err, res)

    ipcRenderer.send("queryExecutor.runQueryComplete", {
      "error": err,
      "result": res
    });

  });

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
      "result": tableMetadata
    });

  });

});