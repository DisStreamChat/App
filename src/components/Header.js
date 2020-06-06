import React, { useCallback, useState, useEffect } from 'react';
import "./Header.css"
import firebase from "../firebase"
import { withRouter, Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Setting from "./Setting"

const defaults = {
    TwitchColor: "#462b45",
    YoutubeColor: "#c4302b",
    discordColor: "#2d688d",
    highlightedMessageColor: "#6e022e"
}

const Header = props => {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [appSettings, setAppSettings] = useState()
    const currentUser = firebase.auth.currentUser
    const id = currentUser.uid

    const clearChat = useCallback(() => {
        props.setMessages(m => m.map(msg => {return {...msg, deleted: true}}))
    }, [props])

    const clearTwitch = useCallback(() => {
        props.setMessages(messages => messages.map(msg => {return {...msg, deleted: msg.deleted || msg.platform === "twitch"}}))
    }, [props])
    
    const clearDiscord = useCallback(() => {
        props.setMessages(messages => messages.map(msg => { return { ...msg, deleted: msg.deleted || msg.platform === "discord"}}))
    }, [props])

    const updateAppSetting = useCallback(async (name, value) => {
        const copy = { ...appSettings }
        copy[name] = value
        const userRef = firebase.db.collection("Streamers").doc(id)
        await userRef.update({
            appSettings: copy
        })
    }, [appSettings, id])

    const signout = useCallback(async () => {
        await firebase.logout()
        localStorage.removeItem("userId")
        localStorage.removeItem("messages")
        props.history.push("/")
    }, [props.history]) 

    useEffect(() => {
        (async () => {
            const unsub = firebase.db.collection("Streamers").doc(id).onSnapshot(snapshot => {
                const data = snapshot.data()
                if (data) {
                    setAppSettings(data.appSettings)
                }
            })
            return unsub
        })()
    }, [id, props.history])

    return (
        <header className={`header ${props.pad} ${settingsOpen && "open"}`} >
            <nav className="nav">
                {props.setMessages && 
                <>
                    <Button variant="contained" onClick={clearChat}>Clear Chat</Button>
                    <Button variant="contained" onClick={clearTwitch}>Clear Twitch Chat</Button>
                    <Button variant="contained" onClick={clearDiscord}>Clear Discord Chat</Button>
                </>
                }
                {props.backButton ? 
                    <Link to="/channels"><Button variant="contained" color="primary">Channels</Button></Link>
                    : 
                    <Button variant="contained" color="primary" onClick={signout}>Sign Out</Button>
                }
            </nav>
            <div className="header-settings">
                {Object.entries(appSettings || {}).sort().sort((a, b) => typeof a[1] === "boolean" ? -1 : 1).map(([key, value]) => {
                    return <Setting key={key} default={defaults[key]} onChange={updateAppSetting} name={key} value={value} type={typeof value === "boolean" ? "boolean" : "color"} />
                })}
            </div>
            <div className="header-lower" onClick={() => setSettingsOpen(o => !o)}>
                <KeyboardArrowDownIcon className={`chevron ${settingsOpen && "open"}`}/>
            </div>
        </header>
    );
} 

export default withRouter(Header); 
