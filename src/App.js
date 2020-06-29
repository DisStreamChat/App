import React, { useEffect, useState, useCallback } from "react";
import firebase from "./firebase";
import { useParams } from "react-router-dom";
import "./App.css";

import openSocket from "socket.io-client";
import Header from "./components/Header";
import { Message } from "distwitchchat-componentlib";
import "distwitchchat-componentlib/dist/index.css";
import "./components/Message.css";

function App() {
	const [socket, setSocket] = useState();
	const [messages, setMessages] = useState([]);
	const [settings, setSettings] = useState({});
    const [channel, setChannel] = useState();
    const [connected, setConnected] = useState(false)
	const { id } = useParams();

	const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		if (currentUser) {
			const unsub = firebase.db
				.collection("Streamers")
				.doc(currentUser.uid)
				.onSnapshot(snapshot => {
					const data = snapshot.data();
					if (data) {
						setSettings(data.appSettings);
					}
				});
			return () => unsub();
		}
	}, [currentUser]);

	// this runs once on load, and starts the socket
	useEffect(() => {
		setSocket(openSocket(process.env.REACT_APP_SOCKET_URL));
	}, []);

	useEffect(() => {
		return () => {
			if (socket) {
				socket.disconnect();
			}
		};
	}, [socket]);

	// this function is passes into the message and will be used for pinning
	const pinMessage = useCallback((id, pinned = true) => {
		setMessages(prev => {
			let copy = [...prev];
			let index = copy.findIndex(msg => msg.id === id);
			if (index === -1) return prev;
			copy[index].pinned = pinned;
			return copy;
		});
	}, []);

	// this is used to delete messages, in certain conditions will also send a message to backend tell it to delete the message from the sent platform
	const removeMessage = useCallback(
		(id, platform) => {
			setMessages(prev => {
				let copy = [...prev];
				let index = copy.findIndex(msg => msg.id === id);
				if (index === -1) return prev;
				copy[index].deleted = true;
				return copy;
			});

			if (platform && socket) {
				socket.emit(`deletemsg - ${platform}`, id);
			}
		},
		[socket]
	);

	// this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useEffect(() => {
		if (socket) {
			socket.removeListener("chatmessage");
			socket.on("chatmessage", msg => {
				setMessages(m => [...m.slice(-Math.max(settings.MessageLimit, 100)), msg]);
			});
			return () => socket.removeListener("chatmessage");
		}
    }, [settings, socket]);
   
    // this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useEffect(() => {
		if (socket) {
			socket.removeListener("imConnected");
			socket.on("imConnected", () => {
                if(channel){
                    socket.emit("addme", channel)
                }
            });
			return () => socket.removeListener("imConnected");
		}
	}, [settings, socket, connected, channel]);

	useEffect(() => {
		setMessages(m => m.slice(-Math.max(settings.MessageLimit, 100)));
	}, [settings]);

	// this is similar to the above useEffect but for adds a listener for when messages are deleted
	useEffect(() => {
		if (socket) {
			socket.removeListener("deletemessage");
			socket.on("deletemessage", removeMessage);
			return () => socket.removeListener("deletemessage");
		}
    }, [socket, removeMessage]);
    
    // this is similar to the above useEffect but for adds a listener for when messages are deleted
	useEffect(() => {
		if (socket) {
			socket.removeListener("purgeuser");
			socket.on("purgeuser", username => {
                console.log("test")
                setMessages(prev => prev.map(msg => ({...msg, deleted: msg.deleted || msg.displayName?.toLowerCase() === username})))
            });
			return () => socket.removeListener("purgeuser");
		}
	}, [socket, removeMessage]);

	useEffect(() => {
		if (id && currentUser) {
			const unsub = firebase.db
				.collection("Streamers")
				.doc(id)
				.onSnapshot(snapshot => {
					const data = snapshot.data();
					if (data) {
						const { TwitchName, guildId, liveChatId } = data;
						setChannel({
							TwitchName,
							guildId,
							liveChatId,
						});
					}
				});
			return () => unsub();
		}
	}, [id, currentUser]);

	useEffect(() => {
		if (channel) {
			// send info to backend with sockets, to get proper socket connection
			if (socket) {
                socket.emit("addme", channel);
			}
		}
	}, [channel, socket]);

	return (
		<div className="app app--dark">
			{/* {settings.showHeader && <Header setMessages={setMessages} backButton/>} */}
			<Header setMessages={setMessages} backButton />
			<main className="body">
				<div className={`overlay-container`}>
					{/* <div className={`overlay-container ${!settings.showHeader && false && "full-body"}`}> */}
					<div className="overlay">
						{messages
							.sort((a, b) => a.sentAt - b.sentAt)
							.map((msg, i) => (
								<Message streamerInfo={settings} pin={pinMessage} delete={removeMessage} key={msg.uuid} msg={msg} />
							))}
					</div>
				</div>
			</main>
		</div>
	);
}

export default App;
