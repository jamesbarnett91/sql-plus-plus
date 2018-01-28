'use strict';
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
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '',
  port: 5432
});

let dataTable;

function runQuery() {
 var query = editorContext.getValue(); 
  console.log(query);

  connectionPool.query(query, (err, res) => {
    console.log(err, res)
    displayResults(res);
  });
}

function displayResults(results) {

  if(dataTable) {
    dataTable.destroy();
    _resultsTable().empty();
  }

  dataTable = _resultsTable().DataTable({
    paging: false,
    destroy: true,
    order: [],
    dom: 'tr',
    data: results.rows,
    columns: _mapColumnProperties(results)
  });
}

function _mapColumnProperties(results) {
  return results.fields.map(function (column) {
    return {
      "data": column.name,
      "title": column.name
    };
  });
}

function _resultsTable() {
  return $("#result-table");
}

$(document).ready(function () {
  $('#run-query').click(runQuery);

  Split(['.editor-row', '.results-row'], {
    sizes: [50, 50],
    direction: 'vertical',
    gutterSize: 10,
    elementStyle: function (dimension, size, gutterSize) {
      return {
        'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
      }
    },
    gutterStyle: function (dimension, gutterSize) {
      return {
        'flex-basis': gutterSize + 'px'
      }
    } 
  });

})

