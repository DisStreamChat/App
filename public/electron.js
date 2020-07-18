const electron = require("electron");
const { BrowserWindow, ipcMain, app } = electron;
const path = require("path");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater");
const windowStateKeeper = require("electron-window-state");
const contextMenu = require('electron-context-menu');

let mainWindow;
let loginWindow;
let clickThroughKey = "a";
let unclickThroughKey = "b";
let opacity = 0.5;
let windows = {}

const width = 650;
const globalShortcut = electron.globalShortcut;

const sendMessageToWindow = (event, message) => {
	if (mainWindow) {
		mainWindow.webContents.send(event, message);
	}
};

const focus = () => {
	sendMessageToWindow("toggle-border", true);
	mainWindow.setOpacity(1);
	mainWindow.setIgnoreMouseEvents(false);
};

const unfocus = () => {
    sendMessageToWindow("toggle-border", false);
    console.log(opacity)
	mainWindow.setOpacity(opacity);
	mainWindow.setIgnoreMouseEvents(true);
};

function windowGenerator({w=width, h=width*1.5, x, y} = {}){
    const options = {
		width: w, // width of the window
		height: h, // height of the window
		minWidth: 275,
		minHeight: 500,
		frame: false, // whether or not the window has 'frame' or header
		backgroundColor: "#001e272e", // window background color, first two values set alpha which is set to 0 for transparency
		transparent: true, // make window transparent
		alwaysOnTop: true, // make is so other windows won't go on top of this one
		webPreferences: {
			nodeIntegration: true, // integrates the frontend with node, this is used for the custom toolbar
		},
    }
    if(x && y){
        options.x = x
        options.y = y
    }
    let window = new BrowserWindow(options)
    window.on("page-title-updated", e => {
		e.preventDefault();
	});
}

function createWindow() {

    contextMenu({
        prepend: (defaultActions, params, browserWindow) => [
            {
                label: 'Search Google for “{selection}”',
                // Only show it when right-clicking text
                visible: params.selectionText.trim().length > 0,
                click: () => {
                    electron.shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
                }
            }
        ]
    });

	let mainWindowState = windowStateKeeper({
		defaultWidth: width,
		defaultHeight: width * 1.5,
    });

	mainWindow = windowGenerator(...mainWindowState)

	mainWindowState.manage(mainWindow);

	mainWindow.loadURL(isDev ? "http://localhost:3005" : `file://${path.join(__dirname, "../build/index.html")}`);
	mainWindow.on("closed", () => (mainWindow = null));

	// hotkey for turning on and off clickthrough
	globalShortcut.register("f6", unfocus);

	globalShortcut.register("f7", focus);

	

	mainWindow.setAlwaysOnTop(true, "screen-saver");
}

// this is used to send all links to the users default browser
app.on("web-contents-created", (e, contents) => {
	contents.on("will-navigate", (event, url) => {
		if ( url.includes("localhost")) return;
		event.preventDefault();
		electron.shell.openExternal(url);
		console.log("blocked navigate:", url);
	});
	contents.on("new-window", async (event, url) => {
		if (url.includes("localhost")) return;
		event.preventDefault();
		electron.shell.openExternal(url);
		console.log("blocked window:", url);
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

ipcMain.on("setopacity", (event, data) => {
	opacity = Math.min(Math.max(+data, 0.1), 1);
});

ipcMain.on("setunclickthrough", (event, data) => {
	try {
		globalShortcut.unregister(clickThroughKey);
		clickThroughKey = data;
		globalShortcut.register(data, function () {
			sendMessageToWindow("toggle-border", true);
			mainWindow.setOpacity(1);
			mainWindow.setIgnoreMouseEvents(false);
		});
	} catch (err) {
		clickThroughKey = data;
		console.log(err, data);
	}
});

ipcMain.on("setclickthrough", (event, data) => {
	try {
		globalShortcut.unregister(unclickThroughKey);
		unclickThroughKey = data;
		globalShortcut.register(data, function () {
			sendMessageToWindow("toggle-border", false);
			mainWindow.setOpacity(0.5);
			mainWindow.setIgnoreMouseEvents(true);
		});
	} catch (err) {
		unclickThroughKey = data;
		console.log(err, data);
	}
});