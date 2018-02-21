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

function createConnection() {
  let connectionProps = parseForm();
  ipcRenderer.send("newConnection.createConnection", connectionProps);
}

$(document).ready(() => {
  $("#create-connection").click(() => {
    createConnection();
  });
  
  $("#test-connection").click(() => {
    //TODO
  });

  $("#cancel").click(() => {
    cancel();
  });
});