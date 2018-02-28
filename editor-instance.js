"use strict";

const { ipcRenderer } = require('electron');
const $ = window.jQuery = require("jquery");
require("jquery-ui");
require("jquery.tabulator");
const cm = require("codemirror");
require("codemirror/mode/sql/sql");
require("codemirror/addon/hint/show-hint.js");
require("codemirror/addon/hint/sql-hint.js");
const Split = require("split.js");

const editorInstanceId = require('uuid/v1')();

let queryExecutorId;

const editorContext = cm(document.getElementById("editor"), {
  value: "select *\nfrom information_schema.tables\n/\nselect now()\n/\nselect *\nfrom foo",
  mode: "text/x-sql",
  theme: "dracula",
  lineNumbers: true,
  gutters: ["CodeMirror-linenumbers", "statement-pointer"],
  extraKeys: { "Ctrl-Space": "autocomplete" }
});

editorContext.on("cursorActivity", (instance) => {
  let coords = instance.getCursor();
  $("#cursor-coords").text("Ln " + (parseInt(coords.line) + 1) + ", Col " + (parseInt(coords.ch) + 1));
});

const statementDelimiter = "/";

let dataTable;
let execStartTime;
let execTimerInterval;
let execElapsedTime;
let queryMark;

ipcRenderer.on("editorInstance.registerQueryExecutor", (event, payload) => {
  queryExecutorId = payload;
  console.log(queryExecutorId);
  ipcRenderer.send("queryExecutor.queryTableMetadata", _generateIpcPayload());
})

ipcRenderer.on("queryExecutor.queryTableMetadataComplete", (event, response) => {
  console.log(response);
  cm.commands.autocomplete = function (cmInstance) {
    cm.showHint(cmInstance, cm.hint.sql, {
      tables: response.result
    });
  }
});

function runQuery() {

  _setExecutionStatusIndicator("RUNNING");
  _startExecTimer();

  let payload = _generateIpcPayload();
  payload.query = findQuery();

  ipcRenderer.send("queryExecutor.runQuery", payload);
}

/**
 * If there's selected text, return it. Otherwise find the statement nearest the cursor.
 * Statements are delimited by lines containing only a "/" character.
 */
function findQuery() {
  let selectedText = editorContext.getSelection();

  if (selectedText !== "") {
    _clearQueryMarks();
    return selectedText;
  }
  else {
    let cursorLine = editorContext.getCursor().line;

    let statementStartLine = editorContext.firstLine();

    // lineCount rather than lastLine here, since lineCount is index 1 based.
    // getRange(from, to) below is 0 based, but the range is exclusive, so if we need to include the last line we need the +1 
    let statementEndLine = editorContext.lineCount();

    // if the current line is a delimiter, thats the end of the statement
    if (editorContext.getLine(cursorLine) === statementDelimiter) {
      statementEndLine = cursorLine;
    }
    else {
      // move down the document until a delimiter or the end of the document is reached
      for (let i = cursorLine + 1; i <= editorContext.lastLine(); i++) {
        if (editorContext.getLine(i) === statementDelimiter) {
          statementEndLine = i;
          break;
        }
      }
    }

    // mode up the document until a previous statements delimiter is found or the start of the document is reached
    for (let i = cursorLine - 1; i >= editorContext.firstLine(); i--) {
      if (editorContext.getLine(i) === statementDelimiter) {
        statementStartLine = i + 1;
        break;
      }
    }

    let query = editorContext.getRange(
      { line: statementStartLine, ch: 0 },
      { line: statementEndLine, ch: 0 }
    );

    console.log(query);

    _clearQueryMarks();

    queryMark = editorContext.markText(
      { line: statementStartLine, ch: 0 },
      { line: statementEndLine, ch: 0 },
      { className: "selected-statement" }
    );

    editorContext.setGutterMarker(statementStartLine, "statement-pointer", _createGutterMarkerDom());

    return query;
  }
}

function _createGutterMarkerDom() {
  return $("<div> > </div>").get(0);
}

function _clearQueryMarks() {
  if (queryMark) {
    queryMark.clear();
  }
  editorContext.clearGutter("statement-pointer");
}

function _generateIpcPayload() {
  return {
    editorInstanceId: editorInstanceId,
    queryExecutorId: queryExecutorId
  }
}

ipcRenderer.on("queryExecutor.runQueryComplete", (event, response) => {
  // TODO - new instances should register with the instance manager, and the manager should proxy IPC messages only to 
  // the webview which sent the message. Rather than sending to all instances and the instance having to check
  // if they were the intended recipient
  if (response.editorInstanceId === editorInstanceId) {
    _stopExecTimer();
    if (response.error === undefined) {
      handleResult(response.result);
    }
    else {
      handleError(response.error);
    }
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
  $("#result-error").removeAttr("style").text("Error (" + err.code + ") - " + err.cause);
  _setExecutionStatusIndicator("ERROR");
  $("#execution-time").text("failed after " + execElapsedTime + " ms");
}

function handleResult(results) {
  _stopExecTimer();
  _clearErrors();
  _destroyDataTable();

  dataTable = $("#result-table").tabulator({
    height: "100%",
    columns: _mapColumnProperties(results),
    data: _escapeRowFieldNames(results.rows)
  });

  _setExecutionStatusIndicator("OK");
  $("#execution-time").text("returned " + results.rowCount + " rows in " + execElapsedTime + " ms");
}

function _mapColumnProperties(results) {
  return results.fields.map((column) => {
    return {
      field: "_" + column.name, // "_" to match up to the output of _escapeRowFieldNames()
      title: column.name
    };
  });
}

/**
 * Return the row object with all fields prefixed with an underscore.
 * This avoids issues with Tabulator which doesn't like fields to have the same identifiers
 * as built in JS properties/functions (e.g. 'length')
 */
function _escapeRowFieldNames(rows) {
  return rows.map(row => {
    let escapedRow = {}
    Object.keys(row).forEach(key => {
      escapedRow["_" + key] = row[key];
    });
    return escapedRow;
  });
}

function _resultTable() {
  return $("#result-table");
}

function _setExecutionStatusIndicator(status) {
  switch (status) {
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
    _resultTable().tabulator("destroy");
    _resultTable().removeAttr("style").empty();
    dataTable = undefined;
  }
}

function _clearErrors() {
  $("#result-error").attr("style", "display:none;").empty();
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

