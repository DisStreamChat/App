const { ipcRenderer } = require("electron")

ipcRenderer.on("update-progress", (event, text) => {
    // console.log(text)
    document.getElementById("download-text").innerText = `Downloading update: ${text}`
    document.getElementById("loader").style.width = text
})