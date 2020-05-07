import React, { useEffect, useState, useContext } from 'react';
import firebase from "./firebase"
import './App.css';

import openSocket from 'socket.io-client';
import Message from './components/Message';
import Header from './components/Header';
import { AppContext } from './contexts/AppContext';

function App() {
  const [error, setError] = useState("")
  const [streamerInfo, setStreamerInfo] = useState()
  const [socket, setSocket] = useState()
  const [messages, setMessages] = useState([])
  const [loaded, setLoaded] = useState(false)

  const { userId, setUserId } = useContext(AppContext)

    useEffect(() => {
        if (loaded) {
            localStorage.setItem("messages", JSON.stringify(messages))
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
	setSocket(openSocket('http://localhost:3200'))
  }, [])

  useEffect(() => {
	if (socket) {
	  socket.on("chatmessage", msg => {
		setMessages(m => [...(m.slice(0, 100)), msg])
	  })
	}
  }, [socket])

  useEffect(() => {
	  (async () => {
		if(userId){
		  const db = firebase.app.firestore()
		  const streamerInfo = await db.collection("Streamers").doc(userId).get()       
          setStreamerInfo(streamerInfo.data());
		}else if(localStorage.getItem("userId")){
            setUserId(localStorage.getItem("userId"))
        }
        console.log(userId)
	  })();
  }, [userId, setUserId])

  useEffect(() => {
	if (streamerInfo) {
	  // send infoString to backend with sockets, to get proper socket connection
	  if (socket) {
		socket.emit("addme", streamerInfo)
	  }
	}
  }, [streamerInfo, socket])

  const removeMessage = id => {
	setTimeout(() => {
	  const copy = [...messages].filter(m => m.uuid !== id)
	  setMessages(copy)
	}, 800)
  }


  return (
	<div className="app app--dark">
	  <Header setMessages={setMessages} />
	  <main className="body">
		<div className="overlay-container">
		  <div className="overlay">
			{messages.map(msg => (
			  <Message delete={removeMessage} key={msg.uuid} msg={msg} />
			))}
		  </div>
		</div>
	  </main>
	</div>
  );
}

export default App;
