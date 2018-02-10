"use strict";

const { ipcRenderer } = require('electron');
const $ = require("jquery");
const cm = require("codemirror");
require("datatables")(window, $);
require("codemirror/mode/sql/sql");
const Split = require("split.js");

const editorContext = cm(document.getElementById("editor"), {
  value: "select *\nfrom information_schema.tables",
  mode: "text/x-sql",
  theme: "dracula",
  lineNumbers: true
});

let dataTable;
let execStartTime;
let execTimerInterval;
let execElapsedTime;

function runQuery() {

  _setExecutionStatusIndicator("RUNNING");
  _startExecTimer();

  var query = editorContext.getValue(); 
  console.log(query);

  _destroyDataTable();

  ipcRenderer.send("queryExecutor.runQuery", query);
}

ipcRenderer.on("queryExecutor.runQueryComplete", (event, response) => {
  _stopExecTimer();
  if(response.error === undefined) {
    handleResult(response.result);
  }
  else {
    handleError(response.error);
  }

  

});

function _startExecTimer() {
  execStartTime = new Date;
  execElapsedTime = 0;
  execTimerInterval = setInterval(() => {
    execElapsedTime = Date.now() - execStartTime;
    $("#execution-time").text("exec time: " + execElapsedTime + "ms");
  }, 10);
}

function _stopExecTimer() {
  clearInterval(execTimerInterval);
  execStartTime = null;
}

function handleError(err) {
  _stopExecTimer();
  _destroyDataTable();
  $("#result-error").text("Error (" + err.code + ") - " + err.message);
  _setExecutionStatusIndicator("ERROR");
  $("#execution-time").text("failed after " + execElapsedTime + " ms");
}

function handleResult(results) {
  _stopExecTimer();
  $("#result-error").empty();
  _destroyDataTable();

  dataTable = _resultTable().DataTable({
    paging: false,
    order: [],
    dom: "tr",
    data: results.rows,
    columns: _mapColumnProperties(results)
  });

  _setExecutionStatusIndicator("OK");
  $("#execution-time").text("returned " + results.rowCount + " rows in " + execElapsedTime + " ms");
}

function _mapColumnProperties(results) {
  return results.fields.map((column) => {
    return {
      "data": column.name,
      "title": column.name
    };
  });
}

function _resultTable() {
  return $("#result-table");
}

function _setExecutionStatusIndicator(status) {
  switch(status) {
    case "RUNNING":
      $("#execution-status").removeClass().addClass("exec-running").text("Running");
      break;
    case "OK":
      $("#execution-status").removeClass().addClass("exec-ok").text("Ok");
      break;
    case "ERROR":
      $("#execution-status").removeClass().addClass("exec-error").text("Error");
      break;        
  }
}

function _destroyDataTable() {
  if (dataTable) {
    dataTable.destroy();
    _resultTable().empty();
    dataTable = undefined;
  }
}

function _onKeyUp(event) {
  if (event.ctrlKey && event.keyCode == 13) {
    runQuery();
  }
}

$(document).ready(() => {
  
  // Event handlers
  $("#run-query").click(runQuery);
  $(document).keyup(_onKeyUp);

  Split([".editor-row", ".results-row"], {
    sizes: [50, 50],
    direction: "vertical",
    gutterSize: 10,
    elementStyle: (dimension, size, gutterSize) => {
      return {
        "flex-basis": "calc(" + size + "% - " + gutterSize + "px"
      }
    },
    gutterStyle: (dimension, gutterSize) => {
      return {
        "flex-basis": gutterSize + "px"
      }
    } 
  });

})

