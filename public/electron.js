const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
const width = 650

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: width, // width of the window
        height: width*1.5, // height of the window
        icon: `${process.env.PUBLIC_URL}/dual.png`, // icon, which is only used in the production version
        frame: false, // whether or not the window has 'frame' or header
        backgroundColor: '#001e272e', // window background color, first two values set alpha which is set to 0 for transparency
        transparent: true, // make window transparent
        alwaysOnTop: true, // make is so other windows won't go on top of this one
    });

    mainWindow.loadURL(
        isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`
    );
    mainWindow.on("closed", () => (mainWindow = null));
}


// this is used to send all links to the default browser
// app.on('web-contents-created', (e, contents) => {
//     contents.on('will-navigate', (event, url) => {
//         event.preventDefault();
//         require('electron').shell.openExternal(url);
//         console.log('blocked navigate:', url);
//     });
//     contents.on('new-window', async (event, url) => {
//         event.preventDefault();
//         require('electron').shell.openExternal(url);
//         console.log('blocked window:', url);
//     });
// });

app.on("ready", createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});