const electron = require("electron");
const {BrowserWindow, ipcMain, app} = electron;
const path = require("path");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater")
const log = require("electron-log")

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...")

let mainWindow;
let loginWindow;
let clickThroughKey = "a"
let unclickThroughKey = "b"

const width = 650
const globalShortcut = electron.globalShortcut

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: width, // width of the window
        height: width*1.5, // height of the window
        minWidth: 300,
        frame: false, // whether or not the window has 'frame' or header
        backgroundColor: '#001e272e', // window background color, first two values set alpha which is set to 0 for transparency
        transparent: true, // make window transparent
        alwaysOnTop: true, // make is so other windows won't go on top of this one
        webPreferences: {
            nodeIntegration: true // integrates the frontend with node, this is used for the custom toolbar
        },
    });

    mainWindow.loadURL(
        isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`
    );
    mainWindow.on("closed", () => mainWindow = null);

    // hotkey for turning on and off clickthrough
    globalShortcut.register('f6', function () {
        mainWindow.setOpacity(.5)
        mainWindow.setIgnoreMouseEvents(true)
    })
    
    globalShortcut.register('f7', function () {
        mainWindow.setOpacity(1)
        mainWindow.setIgnoreMouseEvents(false)
    })

    if (!isDev) autoUpdater.checkForUpdates();


}


// this is used to send all links to the users default browser
app.on('web-contents-created', (e, contents) => {
    contents.on('will-navigate', (event, url) => {
        if (url.includes("id.twitch") || url.includes("about:blank") || url.includes("localhost")) return 
        event.preventDefault();
        electron.shell.openExternal(url);
        console.log('blocked navigate:', url);
    });
    contents.on('new-window', async (event, url) => {
        if (url.includes("id.twitch") || url.includes("about:blank") || url.includes("localhost")) return 
        event.preventDefault();
        electron.shell.openExternal(url);
        console.log('blocked window:', url);
    });
});

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

ipcMain.on("setunclickthrough", (event, data) => {
    try {
        globalShortcut.unregister(clickThroughKey)
        clickThroughKey = data
        globalShortcut.register(data, function () {
            mainWindow.setOpacity(1)
            mainWindow.setIgnoreMouseEvents(false)
        })
    } catch (err) {
        clickThroughKey = data
        console.log(err, data)
    }
})

ipcMain.on("setclickthrough", (event, data) => {
    try{
        globalShortcut.unregister(unclickThroughKey)
        unclickThroughKey = data
        globalShortcut.register(data, function () {
            mainWindow.setOpacity(.5)
            mainWindow.setIgnoreMouseEvents(true)
        })
    }catch(err){
        unclickThroughKey = data
        console.log(err, data)
    }
})

ipcMain.on('login', (event) => {
    loginWindow = new BrowserWindow({
        width: width, // width of the window
        height: width, // height of the window
        frame: true, // whether or not the window has 'frame' or header
        backgroundColor: '#001e272e', // window background color, first two values set alpha which is set to 0 for transparency
        alwaysOnTop: true, // make is so other windows won't go on top of this one
        webPreferences: {
            nodeIntegration: false, // don't allow integration with node
            preload: path.join(__dirname, "loginWindow.js")
        },
    });
    loginWindow.loadURL('https://id.twitch.tv/oauth2/authorize?client_id=ip3igc72c6wu7j00nqghb24duusmbr&redirect_uri=https://api.distwitchchat.com/oauth/twitch/&response_type=code&scope=openid%20moderation:read');
});

ipcMain.on('login-data', (event, token) => {
    // ipcMain.emit('log-me-in', token);
    if(mainWindow){
        mainWindow.webContents.send("log-me-in", token)
    }
});

const sendStatusToWindow = text => {
    log.info(text)
    if(mainWindow){
        mainWindow.webContents.send("message", text)
    }
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', info => {
    sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', err => {
    sendStatusToWindow(`Error in auto-updater: ${err.toString()}`);
});
autoUpdater.on('download-progress', progressObj => {
    sendStatusToWindow(
        `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred} + '/' + ${progressObj.total} + )`
    );
});
autoUpdater.on('update-downloaded', info => {
    sendStatusToWindow('Update downloaded; will install now');
    autoUpdater.quitAndInstall();
});