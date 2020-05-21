import React, { useEffect, useState, useContext } from "react"
import firebase from "./firebase"
import "./App.css"

import openSocket from "socket.io-client"
import Message from "./components/Message"
import Header from "./components/Header"
import { AppContext } from "./contexts/AppContext"

function App() {
	const [error, setError] = useState("")
	const [socket, setSocket] = useState()
	const [messages, setMessages] = useState([])
	const [loaded, setLoaded] = useState(false)

	const { streamerInfo, setStreamerInfo, userId, setUserId } = useContext(AppContext)

	useEffect(() => {
		if (loaded) {
			localStorage.setItem("messages", JSON.stringify(messages.filter(msg => !msg.deleted)))
		}
	}, [messages, loaded])

	useEffect(() => {
		(async () => {
			const localMessages = JSON.parse(localStorage.getItem("messages"))
			if (localMessages) {
				await setMessages(localMessages)
			}
			setLoaded(true)
		})()
	}, [])

	useEffect(() => {
		setSocket(openSocket("http://localhost:3200"))
	}, [])

	useEffect(() => {
		if (socket) {
			socket.on("chatmessage", msg => {
                setMessages((m) => [...m.slice(m.length - 100, m.length), {...msg, deleted: false}])
			})
		}
	}, [socket])

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

	const removeMessage = id => {
        setTimeout(async () => {
            const copy = [...messages]
            const index = copy.findIndex(msg => msg.uuid === id)
            copy[index].deleted = true
			setMessages(copy)
		}, 800)
	}

	return (
		<div className="app app--dark">
			{streamerInfo?.showHeader && <Header setMessages={setMessages} />}
			<main className="body">
				<div className={`overlay-container ${!streamerInfo.showHeader && "full-body"}`}>
					<div className="overlay">
						{messages.filter(msg => !msg.deleted).map(msg => (
							<Message delete={removeMessage} key={msg.uuid} msg={msg} />
						))}
					</div>
				</div>
			</main>
		</div>
	)
}

export default App
