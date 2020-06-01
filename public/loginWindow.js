const { ipcRenderer } = require("electron")

window.doLogin = function(data){
    ipcRenderer.send("login-data", data)
}