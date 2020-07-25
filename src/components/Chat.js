import React, { useEffect, useState, useCallback, useRef } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";
import openSocket from "socket.io-client";
import { Message } from "chatbits";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import SearchBox from "./SearchBox";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import { CSSTransition } from "react-transition-group";
import "./Chat.css";
import "./Message.css";
import "chatbits/dist/index.css";
import hasFlag from "../utils/flagFunctions/has";
import fromFlag from "../utils/flagFunctions/from";
import platformFlag from "../utils/flagFunctions/platform";
import isFlag from "../utils/flagFunctions/is";
import { TransitionGroup } from "react-transition-group";
import useHotkeys from "use-hotkeys";

const flagRegex = /(\s|^)(has|from|platform|is):([^\s]*)/gim;

const handleFlags = (searchString, messages) => {
	const flags = [...searchString.matchAll(flagRegex)].map(([, , flag, parameter]) => ({ flag, parameter }));
	const flaglessSearch = searchString.replace(flagRegex, "").trim();
	let matchingMessages = [...messages].filter(msg => !flaglessSearch || msg.body.toLowerCase().includes(flaglessSearch.toLowerCase()));
	flags.forEach(({ flag, parameter }) => {
		if (flag === "has") {
			matchingMessages = hasFlag(parameter, matchingMessages);
		} else if (flag === "from") {
			matchingMessages = fromFlag(parameter, matchingMessages);
		} else if (flag === "platform") {
			matchingMessages = platformFlag(parameter, matchingMessages);
		} else if (flag === "is") {
			matchingMessages = isFlag(parameter, matchingMessages);
		}
	});
	return matchingMessages;
};

const Messages = React.memo(props => {
	return (
		<TransitionGroup>
			{props.messages.map((msg, i) => (
				<Message
					index={msg.id}
					forwardRef={props.unreadMessageHandler}
					streamerInfo={props.settings}
					delete={props.removeMessage}
					timeout={props.timeout}
					ban={props.ban}
					key={msg.id}
					msg={msg}
					pin={() => props.pin(msg.id)}
				/>
			))}
		</TransitionGroup>
	);
});

function App() {
	const [socket, setSocket] = useState();
	const { streamerInfo: settings, messages, setMessages, pinnedMessages, setPinnedMessages } = useContext(AppContext);
	const [channel, setChannel] = useState();
	const [search, setSearch] = useState("");
	const { id } = useParams();
	const [showToTop, setShowToTop] = useState(false);
	const [showSearch, setShowSearch] = useState(true);
	const bodyRef = useRef();
	const observerRef = useRef();
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

	useHotkeys(
		(key, event, handle) => {
			switch (key) {
				case "ctrl+f":
					setShowSearch(true);
					document.getElementById("chat-search").focus();
					break;
				case "esc":
					setShowSearch(false);
					break;
				default:
					break;
			}
		},
		["ctrl+f", "esc"],
		[]
	);

	// this function is passed into the message and will be used for pinning
	const pinMessage = useCallback(
		(id, pinned = true) => {
			const pinning = !!messages.find(msg => msg.id === id);
			if (pinning) {
				//move message from messages to pinned messages
				setMessages(prev => {
					let copy = [...prev];
					let index = copy.findIndex(msg => msg.id === id);
					copy[index].pinned = true;
					const pinnedMessage = copy.splice(index, 1);
					setPinnedMessages(prev => [...prev, ...pinnedMessage]);
					return copy;
				});
			} else {
				setPinnedMessages(prev => {
					let copy = [...prev];
					let index = copy.findIndex(msg => msg.id === id);
					copy[index].pinned = false;
					const unPinnedMessage = copy.splice(index, 1);
					setMessages(prev => [...prev, ...unPinnedMessage].sort((a, b) => a.sentAt - b.sentAt));
					return copy;
				});
			}
		},
		[setMessages, setPinnedMessages, messages]
	);

	const ban = useCallback(
		(id, platform) => {
			if (platform && socket) {
				const banMsg = messages.find(msg => msg.id === id);
				socket.emit(`banuser - ${platform}`, banMsg?.displayName);
			}
		},
		[socket, messages]
	);

	const timeout = useCallback(
		(id, platform) => {
			if (platform && socket) {
				const banMsg = messages.find(msg => msg.id === id);
				socket.emit(`timeoutuser - ${platform}`, banMsg?.[platform === "discord" ? "userId" : "DisplayName"]);
			}
		},
		[socket, messages]
	);

	// this is used to delete messages, in certain conditions will also send a message to backend tell it to delete the message from the sent platform
	const removeMessage = useCallback(
		(id, platform) => {
			setMessages(prev => {
				let copy = [...prev];
				let index = copy.findIndex(msg => msg.id === id);
				if (index === -1) return prev;
				copy.splice(index, 1);
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
				setMessages(m => {
					let ignoredMessage = false;
					if (settings?.IgnoredUsers?.map?.(item => item.value.toLowerCase()).includes(msg.displayName.toLowerCase())) {
						ignoredMessage = true;
					}
					const _ = settings?.IgnoredCommandPrefixes?.forEach(prefix => {
						if (msg.body.startsWith(prefix.value)) {
							ignoredMessage = true;
						}
					});
					if (msg.displayName.toLowerCase() === "disstreamchat") ignoredMessage = false;
					if (ignoredMessage) return m;
					msg.body = `<p>${msg.body.replace(
						new RegExp(`(${currentUser.displayName}|@${currentUser.displayName})`, "ig"),
						"<span class='ping'>$&</span>"
					)}</p>`;
					msg.moddable =
						msg?.displayName?.toLowerCase?.() !== currentUser?.displayName?.toLowerCase?.() &&
                        (!Object.keys(msg.badges).includes("moderator") || Object.keys(msg.badges).includes("broadcaster"));
                    return [...m.slice(-Math.max(settings.MessageLimit, 100)), { ...msg, read: false }];
                    
				});
			});
			return () => socket.removeListener("chatmessage");
		}
	}, [settings, socket, setMessages, currentUser]);

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

	useEffect(() => {
		if (socket) {
			socket.removeListener("updateMessage");
			socket.on("updateMessage", newMessage => {
				setMessages(m => {
					const copy = [...m];
					const messageToUpdate = m.find(msg => msg.id === newMessage.id);
					if (!messageToUpdate) return m;
					const updatedMessage = { ...messageToUpdate, body: newMessage.body };
					const messageToUpdateIndex = m.findIndex(msg => msg.id === newMessage.id);
					copy.splice(messageToUpdateIndex, 1, updatedMessage);
					return copy;
				});
			});
			return () => socket.removeListener("updateMessage");
		}
	}, [socket, removeMessage, setMessages]);

	// this is similar to the above useEffect but for adds a listener for when messages are deleted
	useEffect(() => {
		if (socket) {
			socket.removeListener("purgeuser");
			socket.on("purgeuser", username => {
				setMessages(prev => prev.filter(msg => msg.displayName?.toLowerCase() !== username.toLowerCase()));
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

	const scrollTop = useCallback(() => {
		bodyRef.current.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	}, []);

	useEffect(() => {
		bodyRef.current.addEventListener("scroll", e => {
			setShowToTop(prev => bodyRef.current.scrollTop > 600);
		});
	}, []);

	const checkReadMessage = useCallback(
		node => {
			if (!node) return;
			if (!observerRef.current) {
				observerRef.current = new IntersectionObserver(entries => {
					entries.forEach((entry, i) => {
						if (entry.isIntersecting) {
							setMessages(prev => {
								const copy = [...prev];
								const index = copy.findIndex(msg => msg.id === entry.target.dataset.idx);
								if (index !== -1) {
									copy[index].read = true;
								}
								return copy;
							});
							observerRef.current.unobserve(entry.target);
						}
					});
				});
			}
			if (observerRef.current && node) {
				try {
					observerRef.current.observe(node);
				} catch (err) {
					console.log(node);
				}
			}
		},
		[observerRef, setMessages]
	);

	const [flagMatches, setFlagMatches] = useState([]);

	useEffect(() => {
		setFlagMatches(handleFlags(showSearch ? search : "", [...messages, ...pinnedMessages]).filter(msg => !msg.deleted));
	}, [messages, search, showSearch, pinnedMessages]);

	return (
		<div style={{ fontFamily: settings.Font }} ref={bodyRef} className="overlay-container">
			<div className="overlay">
				<Messages
					messages={flagMatches
						// .filter(msg => !search || msg.displayName.toLowerCase().includes(search.toLowerCase()) || msg.body.toLowerCase().includes(search.toLowerCase()))
						.sort((a, b) => a.sentAt - b.sentAt)}
					settings={settings}
					timeout={timeout}
					removeMessage={removeMessage}
					ban={ban}
					unreadMessageHandler={checkReadMessage}
					pin={pinMessage}
				/>
				{showSearch && <SearchBox id="chat-search" onChange={handleSearch} placeHolder="Search Messages" />}
			</div>
			<CSSTransition unmountOnExit timeout={400} classNames={"to-top-node"} in={showToTop}>
				<button className="back-to-top-button fade-in" onClick={scrollTop}>
					<KeyboardArrowUpIcon></KeyboardArrowUpIcon>
				</button>
			</CSSTransition>
		</div>
	);
}

export default React.memo(App);
