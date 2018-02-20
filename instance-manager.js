"use strict";

const { ipcRenderer } = require('electron');
const TabGroup = require("electron-tabs");
const $ = window.jQuery = require("jquery");

const tabGroup = new TabGroup();

function createNewConnection() {
  ipcRenderer.send("instanceManager.openNewConnectionDialog");
}

function registerNewInstance(assignedQueryExecutorId) {
  tabGroup.addTab({
    title: "Electron",
    src: "file://" + __dirname + "/editor-instance.html",
    visible: true,
    active: true,
    webviewAttributes: {"nodeintegration":true},
    ready: tab => {
      let webview = tab.webview;
      if (!!webview) {
        webview.addEventListener("dom-ready", () => {
          webview.send("editorInstance.registerQueryExecutor", assignedQueryExecutorId);
        })
      }
    }
  });
}

ipcRenderer.on("instanceManager.registerNewInstance", (event, assignedQueryExecutorId) => {
  registerNewInstance(assignedQueryExecutorId);
});


$(document).ready(() => {
  $("#new-connection").click(() => {
    createNewConnection();
  })
})