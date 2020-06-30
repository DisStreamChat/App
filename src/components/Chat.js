import React, { useEffect, useState, useCallback } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";

import openSocket from "socket.io-client";
import { Message } from "distwitchchat-componentlib";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import SearchBox from "./SearchBox";
import "./Chat.css";
import "./Message.css";
import "distwitchchat-componentlib/dist/index.css";

const Messages = React.memo(props => {
	return (
		<>
			{props.messages.map((msg, i) => (
				<Message streamerInfo={props.settings} delete={props.removeMessage} key={msg.id} msg={msg} />
			))}
		</>
	);
});

function App() {
	const [socket, setSocket] = useState();
	const { streamerInfo: settings, messages, setMessages } = useContext(AppContext);
	const [channel, setChannel] = useState();
	const [search, setSearch] = useState("");
	const { id } = useParams();
	const currentUser = firebase.auth.currentUser;

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

	// this function is passed into the message and will be used for pinning
	// const pinMessage = useCallback((id, pinned = true) => {
	// 	setMessages(prev => {
	// 		let copy = [...prev];
	// 		let index = copy.findIndex(msg => msg.id === id);
	// 		if (index === -1) return prev;
	// 		copy[index].pinned = pinned;
	// 		return copy;
	// 	});
	// }, []);

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
		[socket, setMessages]
	);

	// this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useEffect(() => {
		if (socket) {
			socket.removeListener("chatmessage");
			socket.on("chatmessage", msg => {
				setMessages(m => [...m.slice(-Math.max(settings.MessageLimit, 100)), msg].sort((a, b) => a.sentAt - b.sentAt));
			});
			return () => socket.removeListener("chatmessage");
		}
	}, [settings, socket, setMessages]);

	// this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useEffect(() => {
		if (socket) {
			socket.removeListener("imConnected");
			socket.on("imConnected", () => {
				if (channel) {
					socket.emit("addme", channel);
				}
			});
			return () => socket.removeListener("imConnected");
		}
	}, [settings, socket, channel]);

	useEffect(() => {
		setMessages(m => m.slice(-Math.max(settings.MessageLimit, 100)));
	}, [settings, setMessages]);

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
				console.log("test");
				setMessages(prev => prev.map(msg => ({ ...msg, deleted: msg.deleted || msg.displayName?.toLowerCase() === username })));
			});
			return () => socket.removeListener("purgeuser");
		}
	}, [socket, removeMessage, setMessages]);

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

	const handleSearch = useCallback(setSearch);

	return (
		<div className="overlay-container">
			<div className="overlay">
				<Messages
					messages={messages.filter(msg => !search || msg.body.toLowerCase().includes(search.toLowerCase()))}
					settings={settings}
					removeMessage={removeMessage}
				/>
				<SearchBox onChange={handleSearch} placeHolder="Search Messages" />
			</div>
		</div>
	);
}

export default React.memo(App);
