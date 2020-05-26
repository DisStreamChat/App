import React, { useEffect, useState, useContext, useCallback } from "react"
import firebase from "./firebase"
import "./App.css"

import openSocket from "socket.io-client"
import MessagE from "./components/Message"
import Header from "./components/Header"
import { AppContext } from "./contexts/AppContext"
import { useInterval } from 'react-use';
import {Message} from "distwitchchat-componentlib"

function App() {
	const [error, setError] = useState("")
	const [socket, setSocket] = useState()
    const [messages, setMessages] = useState([])
    const [pinnedMessages, setPinnedMessages] = useState([])
	const [loaded, setLoaded] = useState(false)

	const { streamerInfo, setStreamerInfo, userId, setUserId } = useContext(AppContext)

	useEffect(() => {
		if (loaded) {
			localStorage.setItem("messages", JSON.stringify(messages.filter(msg => !msg.deleted)))
            localStorage.setItem("pinned-messages", JSON.stringify(pinnedMessages.filter(msg => !msg.deleted)))
        }
    }, [messages, pinnedMessages, loaded])

	useEffect(() => {
		(async () => {
            const localMessages = JSON.parse(localStorage.getItem("messages"))
            const localPinnedMesages = JSON.parse(localStorage.getItem("pinned-messages"))
			if (localMessages) {
				await setMessages(localMessages)
            }
            if(localPinnedMesages){
                setPinnedMessages(localPinnedMesages)
            }
			setLoaded(true)
		})()
	}, [])

	useEffect(() => {
        setSocket(openSocket(process.env.REACT_APP_SOCKET_URL))
    }, [])
    
    const pinMessage = useCallback(id => {
        let copy = [...messages]
        let index = copy.findIndex(msg => msg.id === id)
        if (index === -1) return
        const pinnedMessage = copy.splice(index, 1)
        setMessages(copy)
        setPinnedMessages(m => [...m, ...pinnedMessage])
    }, [messages])

    const removeMessage = useCallback((id, platform) => {
        let copy = [...messages]
        let index = copy.findIndex(msg => msg.id === id)
        if(index === -1) {
            copy = [...pinnedMessages]
            index = copy.findIndex(msg => msg.id === id)
        }
        if (index === -1) return
        copy[index].deleted = true 
        setMessages(copy)

        if (platform && socket){
            socket.emit(`deletemsg - ${platform}`, id)
        }
    }, [setMessages, messages, socket, pinnedMessages])

	useEffect(() => {
		if (socket) {
            socket.removeListener('chatmessage');
			socket.on("chatmessage", msg => {
                setMessages((m) => [...m.slice(m.length - 100, m.length), {...msg, sentAt: new Date().getTime(), deleted: false}])
            })
            return () => socket.removeListener('chatmessage');
        }
        
    }, [socket])
    
    useEffect(() => {
        if(socket){
            socket.removeListener('deletemessage');
            socket.on("deletemessage", removeMessage)
            return () => socket.removeListener("deletemessage")
        }
    }, [socket, removeMessage])

	useEffect(() => {
		(async () => {
			if (userId) {
				const db = firebase.app.firestore()
				const unsubscribe = db.collection("Streamers").doc(userId).onSnapshot(snapshot => {
                    setStreamerInfo(snapshot.data())
                })
                return () => unsubscribe();
			} else if (localStorage.getItem("userId")) {
				setUserId(localStorage.getItem("userId"))
			}
			console.log(userId)
		})()
	}, [userId, setUserId, setStreamerInfo])

	useEffect(() => {
		if (streamerInfo) {
			// send infoString to backend with sockets, to get proper socket connection
			if (socket) {
				socket.emit("addme", streamerInfo)
			}
		}
    }, [streamerInfo, socket])
    
    useInterval(() => {
        setMessages(m => m.filter(msg => !msg.deleted))
    }, 60000)

	return (
		<div className="app app--dark">
			{streamerInfo?.showHeader && <Header setMessages={setMessages} />}
			<main className="body">
				<div className={`overlay-container ${!streamerInfo.showHeader && "full-body"}`}>
					<div className="overlay">
						{messages.sort((a, b) => a.sentAt - b.sentAt).map((msg, i) => (
                            <MessagE pin={pinMessage} delete={removeMessage} key={i} msg={msg} />
						))}
                        {pinnedMessages.map(msg => (
                            <MessagE pin={pinMessage} delete={removeMessage} key={msg.uuid} msg={msg} pinned />
                        ))}
					</div> 
				</div>
			</main>
		</div>
	)
}

export default App
