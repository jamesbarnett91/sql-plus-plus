const $ = require('jquery');
const cm = require("codemirror");
const { Pool } = require("pg");
require('datatables')(window, $);
require("codemirror/mode/sql/sql");

const editorContext = cm(document.getElementById("editor"), {
  value: "select *\nfrom foo",
  mode: "text/x-sql",
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
})

