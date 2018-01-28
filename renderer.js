"use strict";

const $ = require("jquery");
const cm = require("codemirror");
const { Pool } = require("pg");
require("datatables")(window, $);
require("codemirror/mode/sql/sql");
const Split = require("split.js");

const editorContext = cm(document.getElementById("editor"), {
  value: "select *\nfrom information_schema.tables",
  mode: "text/x-sql",
  theme: "dracula",
  lineNumbers: true
});

const connectionPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "",
  port: 5432
});

let dataTable;

function runQuery() {

  _setExecutionStatusIndicator("RUNNING");
 
  var query = editorContext.getValue(); 
  console.log(query);

  connectionPool.query(query, (err, res) => {
    console.log(err, res)
    
    if(err === undefined) {
      handleResult(res);
    }
    else {
      handleError(err);
    }
    
  });
}

function handleError(err) {
  _destroyDataTable();
  $("#result-error").text("Error (" + err.code + ") - " + err.message);
  _setExecutionStatusIndicator("ERROR");
}

function handleResult(results) {
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
}

function _mapColumnProperties(results) {
  return results.fields.map(function (column) {
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

$(document).ready(function () {
  
  // Event handlers
  $("#run-query").click(runQuery);
  $(document).keyup(_onKeyUp);

  Split([".editor-row", ".results-row"], {
    sizes: [50, 50],
    direction: "vertical",
    gutterSize: 10,
    elementStyle: function (dimension, size, gutterSize) {
      return {
        "flex-basis": "calc(" + size + "% - " + gutterSize + "px"
      }
    },
    gutterStyle: function (dimension, gutterSize) {
      return {
        "flex-basis": gutterSize + "px"
      }
    } 
  });

})

