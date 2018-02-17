"use strict";

const { ipcRenderer } = require('electron');
const TabGroup = require("electron-tabs");

let tabGroup = new TabGroup();
let tab = tabGroup.addTab({
  title: "Electron",
  src: 'file://' + __dirname + '/editor-instance.html',
  visible: true,
  active: true,
  webviewAttributes: {"nodeintegration":true},
  // ready: tab => {
  //   let webview = tab.webview;
  //   if (!!webview) {
  //     webview.addEventListener('dom-ready', () => {
  //       webview.openDevTools();
  //     })
  //   }
  // }
});

let tab2 = tabGroup.addTab({
  title: "Electron",
  src: 'file://' + __dirname + '/editor-instance.html',
  visible: true,
  active: true,
  webviewAttributes: { "nodeintegration": true },
});