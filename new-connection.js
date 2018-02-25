"use strict";

const { remote, ipcRenderer } = require("electron");
const $ = window.jQuery = require("jquery");

function cancel() {
  let confirm = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    type: "question",
    buttons: ["Yes", "No"],
    title: "Confirm",
    message: "Remove this connection?"
  });

  if (confirm === 0) {
    remote.getCurrentWindow().close();
  }
}

function parseForm() {
  let formData = {};

  $("form").serializeArray().forEach((input) => {
    formData[input.name] = input.value;
  });
    
  return formData;
}

function createConnection(isTest) {
  $("#status-message").empty();
  let connectionProps = parseForm();
  connectionProps.isTest = isTest;
  ipcRenderer.send("newConnection.createConnection", connectionProps);
}

ipcRenderer.on("newConnection.initialisationFailed", (event, error) => {
  let errorMsg = $("<div class='notification is-danger'></div>").text(error.cause);
  $("#status-message").append(errorMsg);
});

ipcRenderer.on("newConnection.connectionTestOk", (event) => {
  let status = $("<div class='notification is-success'></div>").text("Connection OK");
  $("#status-message").append(status);
});

$(document).ready(() => {
  $("#create-connection").click(() => {
    createConnection(false);
  });
  
  $("#test-connection").click(() => {
    createConnection(true);
  });

  $("#cancel").click(() => {
    cancel();
  });
});