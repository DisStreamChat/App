const electron = require("electron");
const { BrowserWindow, ipcMain, app, globalShortcut } = electron;
const path = require("path");
const isDev = require("electron-is-dev");
const windowStateKeeper = require("electron-window-state");
const contextMenu = require("electron-context-menu");
const { autoUpdater } = require("electron-updater")

let mainWindow;
let loginWindow;
let unfocusKey = "f20";
let focusKey = "f21";
let opacity = 0.5;
let windows = {};
const Width = 500;
let focused = true;

const sendMessageToWindow = (event, message, window = mainWindow) => {
	if (window && window.webContents) {
		window.webContents.send(event, message);
	}
};

const focus = () => {
	function focusAction(window) {
		if (window) {
			sendMessageToWindow("toggle-border", true, window);
			window.setOpacity(1);
			window.setIgnoreMouseEvents(false);
			sendMessageToWindow("focus", true, window);
		}
	}
	focused = true;
	focusAction(mainWindow);
	Object.values(windows).forEach(focusAction);
};

const unfocus = () => {
	console.log(opacity);
	function unfocusAction(window) {
		if (window) {
			sendMessageToWindow("toggle-border", false, window);
			window.setOpacity(opacity);
			window.setIgnoreMouseEvents(true);
			sendMessageToWindow("focus", false, window);
		}
	}
	focused = false;
	unfocusAction(mainWindow);
	Object.values(windows).forEach(unfocusAction);
};

const baseUrl = () => (isDev ? "http://localhost:3005" : `file://${path.join(__dirname, "../build/index.html")}`);

function windowGenerator({ width = Width, height = Width * 1.5, x, y } = {}) {
	const options = {
		width: width, // width of the window
		height: height, // height of the window
		minWidth: 290,
		minHeight: 300,
		frame: false, // whether or not the window has 'frame' or header
		backgroundColor: "#001e272e", // window background color, first two values set alpha which is set to 0 for transparency
		transparent: true, // make window transparent
        alwaysOnTop: true, // make is so other windows won't go on top of this one
        fullScreenable: false,
		webPreferences: {
			nodeIntegration: true, // integrates the frontend with node, this is used for the custom toolbar
		},
	};
	if (x != undefined && y != undefined) {
		options.x = x;
		options.y = y;
	}
	let window = new BrowserWindow(options);
	window.on("page-title-updated", e => {
		e.preventDefault();
    });
    window.setAlwaysOnTop(true, "screen-saver");
    try{
        window.setFullScreenable(false)
    }catch(err){

    }
	return window;
}

function createMainWindow() {
    if(!isDev){
        autoUpdater.checkForUpdatesAndNotify().catch(err => console.log(err.message))
    }
	contextMenu({
		prepend: (defaultActions, params, browserWindow) => [
			{
				label: "Search Google for “{selection}”",
				// Only show it when right-clicking text
				visible: params.selectionText.trim().length > 0,
				click: () => {
					electron.shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
				},
			},
		],
	});

	let mainWindowState = windowStateKeeper({
		defaultWidth: Width,
		defaultHeight: Width * 1.5,
	});

	mainWindow = windowGenerator(mainWindowState);

	mainWindowState.manage(mainWindow);
	mainWindow.loadURL(baseUrl());
	mainWindow.on("closed", () => (mainWindow = null));

	// hotkey for turning on and off clickthrough
	globalShortcut.register(unfocusKey, unfocus);

	globalShortcut.register(focusKey, focus);
	mainWindow.on("closed", () => {
		app.quit();
	});

	mainWindow.setThumbarButtons([
		{
			tooltip: "Toggle Focus",
			icon: path.join(__dirname, "focus.png"),
			click() {
				if (focused) unfocus();
				else focus();
			},
		},
	]);

	mainWindow.on("focus", () => {
		sendMessageToWindow("focus", true, mainWindow);
	});

	mainWindow.on("blur", () => {
		sendMessageToWindow("focus", false, mainWindow);
	});

	setTimeout(() => {
		mainWindow.webContents.send("send-platform", process.platform);
	}, 10000);
}

// this is used to send all links to the users default browser
app.on("web-contents-created", (e, contents) => {
	contents.on("will-navigate", (event, url) => {
		if (url.includes("localhost") || url.includes("https://id.twitch.tv/oauth2/authorize")) return;
		event.preventDefault();
		electron.shell.openExternal(url);
		console.log("blocked navigate:", url);
	});
	contents.on("new-window", (event, url) => {
		if (url.includes("localhost")) return;
		event.preventDefault();
		electron.shell.openExternal(url);
		console.log("blocked window:", url);
	});
});

app.on("ready", createMainWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createMainWindow();
	}
});

ipcMain.on("popoutChat", (event, data) => {
	if (windows[data]) {
		windows[data].close();
	}
	const [width, height] = mainWindow.getSize();
	let popoutWindow = windowGenerator({ width, height });
	popoutWindow.loadURL(baseUrl());
	setTimeout(() => {
		popoutWindow.webContents.send("popout", data);
	}, 2000);
	windows[data] = popoutWindow;
	popoutWindow.on("closed", () => (windows[data] = null));
	popoutWindow.on("focus", () => {
		sendMessageToWindow("focus", true, popoutWindow);
	});

	popoutWindow.on("blur", () => {
		sendMessageToWindow("focus", false, popoutWindow);
	});
});

ipcMain.on("popoutViewers", (event, data) => {
	const key = `viewers-${data}`;
	if (windows[key]) {
		windows[key].close();
	}
	const [width, height] = mainWindow.getSize();
	let popoutWindow = windowGenerator({ width, height });
	popoutWindow.loadURL(baseUrl());
	setTimeout(() => {
		popoutWindow.webContents.send("popoutViewers", data);
	}, 1000);
	windows[key] = popoutWindow;
	popoutWindow.on("closed", () => (windows[key] = null));
});

ipcMain.on("closePopout", (event, data) => {
	if (windows[data]) {
		windows[data].close();
		windows[data] = null;
	}
});

ipcMain.on("setopacity", (event, data) => {
	opacity = Math.min(Math.max(+data, 0.1), 1);
});

function clearHotKeys() {
	try {
		globalShortcut.unregister(unfocusKey);
		globalShortcut.unregister(focusKey);
	} catch (err) {
		console.log(err.message);
	}
}

function setHotKeys() {
	console.log(`unfocus: ${unfocusKey}, focus: ${focusKey}`);
	try {
		globalShortcut.register(unfocusKey, unfocus);
		globalShortcut.register(focusKey, focus);
	} catch (err) {
		console.log(err.message);
	}
}

ipcMain.on("clearhotkeys", clearHotKeys);

ipcMain.on("sethotkeys", setHotKeys);

ipcMain.on("setunFocus", (event, data) => {
	try {
		globalShortcut.unregister(unfocusKey);
		unfocusKey = data;
		globalShortcut.register(data, unfocus);
	} catch (err) {
		unfocusKey = data;
		console.log(err, data);
	}
});

ipcMain.on("setFocus", (event, data) => {
	try {
		globalShortcut.unregister(focusKey);
		focusKey = data;
		globalShortcut.register(data, focus);
	} catch (err) {
		focusKey = data;
		console.log(err, data);
	}
});

ipcMain.on("login", event => {
	loginWindow = new BrowserWindow({
		width: Width * 1.1, // width of the window
		height: Width * 1.35, // height of the window
		frame: true, // whether or not the window has 'frame' and header
		backgroundColor: "#001e272e", // window background color, first two values set alpha which is set to 0 for transparency
		alwaysOnTop: true, // make is so other windows won't go on top of this one
		webPreferences: {
			nodeIntegration: false, // don't allow integration with node
			preload: path.join(__dirname, "loginWindow.js"),
		},
	});
	loginWindow.loadURL("https://api.disstreamchat.com/oauth/twitch");
});

ipcMain.on("login-data", (event, token) => {
	if (mainWindow) {
		mainWindow.webContents.send("log-me-in", token);
	}
});
