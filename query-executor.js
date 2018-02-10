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
