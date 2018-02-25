"use strict";

const { ipcRenderer } = require('electron');
const TabGroup = require("electron-tabs");
const $ = window.jQuery = require("jquery");

const tabGroup = new TabGroup();

function createNewConnection() {
  ipcRenderer.send("instanceManager.openNewConnectionDialog");
}

function registerNewInstance(payload) {
  tabGroup.addTab({
    title: getTabTitle(payload.connectionConfig),
    src: "file://" + __dirname + "/editor-instance.html",
    visible: true,
    active: true,
    webviewAttributes: {"nodeintegration":true},
    ready: tab => {
      let webview = tab.webview;
      if (!!webview) {
        webview.addEventListener("dom-ready", () => {
          webview.send("editorInstance.registerQueryExecutor", payload.assignedQueryExecutorId);
        })
      }
    }
  });
}

function getTabTitle(connectionConfig) {
  if(connectionConfig.name) {
    return connectionConfig.name;
  }
  else {
    return connectionConfig.hostname + ":" + connectionConfig.port;
  }
}

ipcRenderer.on("instanceManager.registerNewInstance", (event, payload) => {
  registerNewInstance(payload);
});


$(document).ready(() => {
  $("#new-connection").click(() => {
    createNewConnection();
  })
})