import React, { useEffect, useState, useContext, useCallback } from "react"
import firebase from "./firebase"
import "./App.css"

import openSocket from "socket.io-client"
import Header from "./components/Header"
import { AppContext } from "./contexts/AppContext"
import {Message} from "distwitchchat-componentlib"
import "distwitchchat-componentlib/dist/index.css"
import "./components/Message.css"

function App() {
    // firebase.logout()
	const [socket, setSocket] = useState()
    const [messages, setMessages] = useState([])
	const [loaded, setLoaded] = useState(false)
    const [settings, setSettings] = useState({})

    const { streamerInfo, setStreamerInfo } = useContext(AppContext)
    
    useEffect(() => {
        setSettings(streamerInfo.appSettings || {})
    }, [streamerInfo])

    // this runs whenever the messages array changes and stores the messages in localstorage
	useEffect(() => {
		if (loaded) {
			localStorage.setItem("messages", JSON.stringify(messages.filter(msg => !msg.deleted)))
        }
    }, [messages, loaded])

    // this runs once on load, and it loads messages from localstorage
	useEffect(() => {
		(async () => {
            const localMessages = JSON.parse(localStorage.getItem("messages"))
			if (localMessages) {
				await setMessages(localMessages)
            }
			setLoaded(true)
		})()
	}, [])

    // this runs once on load, and starts the socket
	useEffect(() => {
        setSocket(openSocket(process.env.REACT_APP_SOCKET_URL))
    }, [])
    
    // this function is passes into the message and will be used for pinning
    const pinMessage = useCallback((id, pinned=true) => {
        let copy = [...messages]
        let index = copy.findIndex(msg => msg.id === id)
        if (index === -1) return
        copy[index].pinned = pinned
        setMessages(copy)
    }, [messages])

    // this is used to delete messages, in certain conditions will also send a message to backend tell it to delete the message from the sent platform
    const removeMessage = useCallback((id, platform) => {
        let copy = [...messages]
        let index = copy.findIndex(msg => msg.id === id)
        if (index === -1) return
        copy[index].deleted = true 
        setMessages(copy)

        if (platform && socket){
            socket.emit(`deletemsg - ${platform}`, id)
        }
    }, [messages, socket])

    // this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useEffect(() => {
		if (socket) {
            socket.removeListener('chatmessage');
			socket.on("chatmessage", msg => {
                setMessages((m) => [...m.slice(m.length - 100, m.length), msg])
            })
            return () => socket.removeListener('chatmessage');
        }
    }, [socket])
    
    // this is similar to the above useEffect but for adds a listener for when messages are deleted
    useEffect(() => {
        if(socket){
            socket.removeListener('deletemessage');
            socket.on("deletemessage", removeMessage)
            return () => socket.removeListener("deletemessage")
        }
    }, [socket, removeMessage])

    // used for the current method of local authentication, attempts to get database info from a userId, if no userId is found attempt to get it from localstorage 
	useEffect(() => {
		(async () => {
			const db = firebase.app.firestore()
			const unsubscribe = db.collection("Streamers").doc(firebase.auth.currentUser.uid).onSnapshot(snapshot => {
                setStreamerInfo(snapshot.data())
            })
            return () => unsubscribe();
		})()
	}, [setStreamerInfo])

	useEffect(() => {
		if (streamerInfo) {
			// send infoString to backend with sockets, to get proper socket connection
			if (socket) {
				socket.emit("addme", streamerInfo)
			}
		}
    }, [streamerInfo, socket])
    
	return (
		<div className="app app--dark">
            {streamerInfo?.appSettings?.showHeader && <Header setMessages={setMessages} />}
			<main className="body">
				<div className={`overlay-container ${!streamerInfo?.appSettings?.showHeader && "full-body"}`}>
					<div className="overlay">
						{messages.sort((a, b) => a.sentAt - b.sentAt).map((msg, i) => (
                            <Message streamerInfo={settings} pin={pinMessage} delete={removeMessage} key={msg.uuid} msg={msg} />
						))}
					</div> 
				</div>
			</main>
		</div>
	)
}

export default App
