const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
const width = 650

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: width,
        height: 1080,
        icon: "",
        frame: false,
        backgroundColor: '#1e272e',
        x: 1920 - width,
        y: 0,
        hasShadow: true,
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js'),

            // 2. Enable Node.js integration
            nodeIntegration: true
        }

    });

    
    mainWindow.loadURL(
        isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../build/index.html")}`
    );
    mainWindow.on("closed", () => (mainWindow = null));
}

// app.on('web-contents-created', (e, contents) => {
//     console.log('we did it');
//     contents.on('will-navigate', (event, url) => {
//         event.preventDefault();
//         console.log('blocked navigate:', url);
//     });
//     contents.on('new-window', async (event, url) => {
//         event.preventDefault();
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