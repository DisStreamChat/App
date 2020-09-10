import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";
import openSocket from "socket.io-client";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import SearchBox from "./SearchBox";
import { CSSTransition } from "react-transition-group";
import "./Chat.scss";
import "./Message.scss";
import "chatbits/dist/index.css";
import useHotkeys from "use-hotkeys";
import Viewers from "./Viewers";
import { useLocalStorage } from "react-use";
import sha1 from "sha1";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import useSocketEvent from "../hooks/useSocketEvent";
import { Tooltip } from "@material-ui/core";
import EmotePicker from "./EmotePicker/EmotePicker";
import { useAsyncMemo } from "use-async-memo";
import handleFlags from "../utils/flagFunctions";
import { UserItem, EmoteItem } from "./AutoFillItems";
import Messages from "./MessageList";
import { displayMotes } from "../utils/constants";

function App() {
	const socketRef = useRef();
	const {
		streamerInfo: settings,
		messages,
		setMessages,
		pinnedMessages,
		setPinnedMessages,
		showViewers,
		windowFocused,
		userData: userInfo,
		setUnreadMessageIds,
		modChannels,
	} = useContext(AppContext);
	const [channel, setChannel] = useState();
	const [search, setSearch] = useState("");
	const { id } = useParams();
	const [storedMessages, setStoredMessages] = useLocalStorage(`messages`, {});
	const [storedPinnedMessages, setStoredPinnedMessages] = useLocalStorage(`pinned messages`, {});
	const [showToTop, setShowToTop] = useState(false);
	const [showSearch, setShowSearch] = useState(true);
	const [chatValue, setChatValue] = useState("");
	const bodyRef = useRef();
	const observerRef = useRef();
	const currentUser = firebase.auth.currentUser;
	const [emoteIndex, setEmoteIndex] = useState(0);
	const [emotePickerVisible, setEmotePickerVisible] = useState(false);

	const isMod = useAsyncMemo(async () => {
		try {
			if (userInfo?.name?.toLowerCase?.() === channel?.TwitchName) return true;
			const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/checkmod?user=${userInfo?.name?.toLowerCase?.()}&channel=${channel?.TwitchName}`;
			const response = await fetch(apiUrl);
			const json = await response.json();
			return !!json;
		} catch (err) {
			return false;
		}
	}, [channel, userInfo]);

	useEffect(() => {
		if (id) {
			setTimeout(() => {
				setMessages(storedMessages[id] || []);
				setPinnedMessages(storedPinnedMessages[id] || []);
			}, 200);
		}
	}, [id]);

	useEffect(() => {
		if (!settings.DisableLocalStorage && messages && id) {
			setStoredMessages(prev => {
				return { ...storedMessages, [id]: messages.slice(-Math.max(settings.MessageLimit || 100, 100)) };
			});
			setStoredPinnedMessages(prev => ({ ...storedPinnedMessages, [id]: pinnedMessages }));
		}
	}, [messages, settings, pinnedMessages]);

	// this runs once on load, and starts the socket
	useEffect(() => {
		console.log("reseting");
		const _ = socketRef?.current?.disconnect?.();
		socketRef.current = openSocket(process.env.REACT_APP_SOCKET_URL);
	}, [id]);

	useEffect(() => {
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [socketRef]);

	useHotkeys(
		(key, event, handle) => {
			switch (key) {
				case "ctrl+f":
					setSearch("");
					setShowSearch(true);
					document.getElementById("chat-search").focus();
					break;
				case "esc":
					setShowSearch(false);
					setSearch("");
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
		id => {
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
		async (id, platform) => {
			if (platform && socketRef.current) {
				let modName = userInfo.name;
				if (!modName) {
					console.log("attempting to obtain username");
					const UserData = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
					modName = UserData.name;
				}

				const banMsg = messages.find(msg => msg.id === id);
				socketRef.current.emit(`banuser - ${platform}`, {
					modName,
					user: banMsg?.[platform === "discord" ? "userId" : "displayName"],
				});
			}
		},
		[socketRef, messages, userInfo, currentUser]
	);

	const timeout = useCallback(
		async (id, platform) => {
			if (platform && socketRef.current) {
				const banMsg = messages.find(msg => msg.id === id);
				// on discord we delete by userId and on twitch we delete by username
				let modName = userInfo.name;
				if (!modName) {
					console.log("attempting to obtain username");
					const UserData = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
					modName = UserData.name;
				}
				socketRef.current.emit(`timeoutuser - ${platform}`, {
					modName,
					user: banMsg?.[platform === "discord" ? "userId" : "displayName"],
				});
			}
		},
		[socketRef, messages, userInfo, currentUser]
	);

	// this is used to delete messages, in certain conditions will also send a message to backend tell it to delete the message from the sent platform
	const removeMessage = useCallback(
		async (id, platform) => {
			setMessages(prev => {
				let copy = [...prev];
				let index = copy.findIndex(msg => msg.id === id);
				if (index === -1) return prev;
				copy.splice(index, 1);
				return copy;
			});

			if (isMod) {
				let modName = userInfo.name;
				if (!modName) {
					console.log("attempting to obtain username");
					const UserData = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
					modName = UserData.name;
				}

				if (platform && socketRef.current) {
					socketRef.current.emit(`deletemsg - ${platform}`, { id, modName });
				}
			}
		},
		[socketRef, isMod, setMessages, userInfo, currentUser]
	);

	useSocketEvent(socketRef.current, "auto-mod", msg => {
		msg.streamer = channel.TwitchName;
		msg.autoMod = true;
		if (settings?.ReverseMessageOrder) {
			const shouldScroll = Math.abs(bodyRef.current.scrollTop - bodyRef.current.scrollHeight) < 1500;
			setTimeout(() => {
				if (shouldScroll) {
					bodyRef.current.scrollTo({
						top: bodyRef.current.scrollHeight,
						behavior: "smooth",
					});
				}
			}, 200);
		}

		// add the "accept" and "deny" buttons to the message
		msg.body = `<p style="display: inline-block; width: 100% !important;"><span>Message held from <span style="background: #ff5c826e;">${msg.user}</span> for: <span style="font-weight: bold">${msg.reason}</span></span>\n<span style="background: #ff5c826e; display: inline-block; width: 100% !important;">${msg.body}</span>\n<span id=${msg.id}-accept class="automod-button" style="color: #19ff19 !important">Accept</span>  <span id=${msg.id}-deny class="automod-button" style="color: red !important">Deny</span></p>`;

		setMessages(m => {
			return [...m.slice(-Math.max(settings.MessageLimit, 100)), { ...msg, read: false }];
		});
	});
	// this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useSocketEvent(socketRef.current, "chatmessage", msg => {
		try {
			msg.streamer = channel.TwitchName;
			if (settings?.ReverseMessageOrder) {
				const shouldScroll = Math.abs(bodyRef.current.scrollTop - bodyRef.current.scrollHeight) < 1500;
				setTimeout(() => {
					if (shouldScroll) {
						bodyRef.current.scrollTo({
							top: bodyRef.current.scrollHeight,
							behavior: "smooth",
						});
					}
				}, 200);
			}
			// by default we don't ignore messages
			if (messages.findIndex(message => message.id === msg.id) !== -1) return;
			let ignoredMessage = false;

			// check if we should ignore this user
			if (settings?.IgnoredUsers?.map?.(item => item.value.toLowerCase()).includes(msg.displayName.toLowerCase())) {
				ignoredMessage = true;
			}

			// check if the message is a command
			const _ = settings?.IgnoredCommandPrefixes?.forEach(prefix => {
				if (msg.body.startsWith(prefix.value)) {
					ignoredMessage = true;
				}
			});

			// don't allow ignoring of notifications from 'disstreamchat'
			if (msg.displayName.toLowerCase() === "disstreamchat") ignoredMessage = false;

			if (settings?.IgnoreCheers && msg.messageId === "cheer") {
				ignoredMessage = true;
			}
			if (settings?.IgnoreFollows && msg.messageId === "follow") {
				ignoredMessage = true;
			}
			if (settings?.IgnoreSubscriptions && msg.messageId === "subscription" && msg.messageType !== "channel-points") {
				ignoredMessage = true;
			}
			if (settings?.IgnoreChannelPoints && msg.messageType === "channel-points") {
				ignoredMessage = true;
			}

			// if ignored don't add the message
			if (ignoredMessage) return;

			// if this message was a reply to a previous message
			if (msg.replyParentDisplayName) {
				msg.body = `<span class="reply-header">Replying to ${msg.replyParentDisplayName}: ${msg.replyParentMessageBody}</span>${msg.body}`.replace(
					`@${msg.replyParentDisplayName}`,
					""
				);
			}

			// add a <p></p> around the message to make formatting work properly also hightlight pings
			const nameRegex = new RegExp(`(?<=\\s|^)(@?${userInfo?.name})`, "igm");
			msg.body = `<p>${msg.body.replace(nameRegex, "<span class='ping'>$&</span>")}</p>`;

			// check if the message can have mod actions done on it. if the user isn't a mod this will always be false
			msg.moddable =
				msg?.displayName?.toLowerCase?.() === userInfo?.name?.toLowerCase?.() ||
				(!Object.keys(msg.badges).includes("moderator") && !Object.keys(msg.badges).includes("broadcaster"));

			if (
				msg.platform !== "discord" &&
				msg?.displayName?.toLowerCase?.() !== userInfo?.name?.toLowerCase?.() &&
				channel?.TwitchName?.toLowerCase?.() === userInfo?.name?.toLowerCase?.()
			)
				msg.moddable = true;
			if (msg.displayName.toLowerCase() === "disstreamchat") msg.moddable = false;

			setMessages(m => {
				return [...m.slice(-Math.max(settings.MessageLimit, 100)), { ...msg, read: false }];
			});
		} catch (err) {}
	});

	// this is run whenever the socket changes and it sets the chatmessage listener on the socket to listen for new messages from the backend
	useSocketEvent(socketRef.current, "imConnected", () => {
		if (channel) {
			socketRef.current.emit("addme", channel);
		}
	});

	useEffect(() => {
		setMessages(m => m.slice(-Math.max(settings.MessageLimit, 100)));
	}, [settings, setMessages]);

	// this is similar to the above useEffect but for adds a listener for when messages are deleted

	useSocketEvent(socketRef.current, "deletemessage", removeMessage);

	useSocketEvent(socketRef.current, "updateMessage", newMessage => {
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

	useSocketEvent(socketRef.current, "purgeuser", username => {
		setMessages(prev => prev.filter(msg => msg.displayName?.toLowerCase() !== username.toLowerCase()));
	});

	useSocketEvent(socketRef.current, "clearchat", () => {
		setMessages([]);
	});

	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(sha1(id))
			.onSnapshot(async snapshot => {
				const data = snapshot.data();
				if (!data) {
					const userData = [...modChannels, { display_name: userInfo.TwitchName, id: userInfo.twitchId }].find(
						channel => channel.id === id
					);
					console.log(userData);
					setChannel({
						TwitchName: userData?.display_name?.toLowerCase?.(),
					});
				} else {
					const { guildId, liveChatId, twitchId } = data;
					const TwitchName = data.TwitchName;
					console.log({
						TwitchName,
						guildId,
						liveChatId,
					});
					setChannel({
						TwitchName,
						guildId,
						liveChatId,
					});
				}
			});
		return unsub;
	}, [id]);

	useEffect(() => {
		if (channel) {
			// send info to backend with sockets, to get proper socket connection
			console.log(channel);
			if (socketRef.current) {
				socketRef.current.emit("addme", channel);
			}
		}
	}, [channel, socketRef]);

	const ReverseMessageOrder = settings?.ReverseMessageOrder;

	useEffect(() => {
		setTimeout(() => {
			if (ReverseMessageOrder) {
				bodyRef.current.scrollTo({
					top: bodyRef.current.scrollHeight,
					// behavior: "smooth",
				});
			} else {
				bodyRef.current.scrollTo({
					top: 0,
					// behavior: "smooth",
				});
			}
		}, 300);
	}, [ReverseMessageOrder]);

	const handleSearch = useCallback(setSearch, []);

	const scrollTop = useCallback(() => {
		setUnreadMessageIds([]);
		bodyRef.current.scrollTo({
			top: settings?.ReverseMessageOrder ? bodyRef.current.scrollHeight : 0,
			behavior: "smooth",
		});
	}, [setUnreadMessageIds, settings]);

	useEffect(() => {
		bodyRef.current.onscroll = e => {
			setShowToTop(prev =>
				!settings?.ReverseMessageOrder
					? bodyRef.current.scrollTop > 600
					: Math.abs(bodyRef.current.scrollTop - bodyRef.current.scrollHeight) > 1500
			);
		};
	}, [settings]);

	const checkReadMessage = useCallback(
		node => {
			if (!node) return;
			if (!observerRef.current) {
				observerRef.current = new IntersectionObserver((entries, observer) => {
					entries.forEach(entry => {
						try {
							const idx = entry.target.dataset.idx;
							try {
								setTimeout(() => {
									try {
										entry.target.classList.remove("_1qxYA");
									} catch (err) {}
								}, 700);
							} catch (err) {}
							if (entry.isIntersecting) {
								setUnreadMessageIds(prev => prev.filter(id => id !== idx));
								const elt = document.querySelector(`div[data-idx="${idx}"]`);
								observer.unobserve(elt);
							} else {
								if (!storedMessages.find(msg => msg.id === idx)) setUnreadMessageIds(prev => [...new Set([...prev, idx])]);
							}
						} catch (err) {}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[observerRef, setUnreadMessageIds]
	);

	const acceptMessage = useCallback(
		async msg => {
			const otc = (
				await firebase.db
					.collection("Secret")
					.doc(currentUser.uid || " ")
					.get()
			).data()?.value;
			await fetch(`${process.env.REACT_APP_SOCKET_URL}/automod/approve?msg_id=${msg.message_id}&otc=${otc}&id=${currentUser.uid}`, {
				method: "POST",
			});
			removeMessage(msg.id);
		},
		[currentUser, removeMessage]
	);

	const denyMessage = useCallback(
		async msg => {
			const otc = (
				await firebase.db
					.collection("Secret")
					.doc(currentUser.uid || " ")
					.get()
			).data()?.value;
			await fetch(`${process.env.REACT_APP_SOCKET_URL}/automod/deny?msg_id=${msg.message_id}&otc=${otc}&id=${currentUser.uid}`, {
				method: "POST",
			});
			removeMessage(msg.id);
		},
		[currentUser, removeMessage]
	);

	const [chatterInfo, setChatterInfo] = useState();
	const [chatterCount, setChatterCount] = useState();
	const [streamerName, setStreamerName] = useState();
	const [allChatters, setAllChatters] = useState();
	const userId = id;

	useEffect(() => {
		(async () => {
			const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${userId}&platform=twitch`;
			const response = await fetch(apiUrl);
			const userData = await response.json();
			let userName = userData?.display_name?.toLowerCase?.();
			setStreamerName(userName);
		})();
	}, [userId]);

	//TODO: use the useInterval hook
	useEffect(() => {
		let id;
		(async () => {
			let userName = streamerName;
			if (!userName) {
				const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${userId}&platform=twitch`;
				const response = await fetch(apiUrl);
				const userData = await response.json();
				userName = userData?.display_name?.toLowerCase?.();
				setStreamerName(userName);
			}
			const chatterUrl = `${process.env.REACT_APP_SOCKET_URL}/chatters?user=${userName}`;
			const getChatters = async () => {
				const response = await fetch(chatterUrl);
				const json = await response.json();
				if (json && response.ok) {
					const info = {};
					const chatters = [];
					for (let [key, value] of Object.entries(json.chatters)) {
						if (value.length === 0) continue;
						info[key] = await Promise.all(
							value.map(async name => {
								chatters.push(name);
								return { login: name, id: name };
							})
						);
					}

					setChatterInfo(info);
					setChatterCount(json.chatter_count);
					setAllChatters(chatters);
				}
			};
			getChatters();
			id = setInterval(getChatters, 120000 * 2);
		})();
		return () => clearInterval(id);
	}, [userId, streamerName, id]);

	const [userEmotes, setUserEmotes] = useState([]);
	useEffect(() => {
		(async () => {
			const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/emotes?user=${userInfo.TwitchName}`;
			const customApiUrl = `${process.env.REACT_APP_SOCKET_URL}/customemotes?channel=${channel?.TwitchName}`;
			let [emotes, customEmotes] = await Promise.all([
				(async () => {
					const response = await fetch(apiUrl);
					return response.json();
				})(),
				(async () => {
					const response = await fetch(customApiUrl);
					return response.json();
				})(),
			]);

			emotes = emotes.emoticon_sets;
			if (emotes) {
				let allEmotes = [];
				for (let [key, value] of Object.entries(emotes)) {
					allEmotes = [...allEmotes, ...value.map(emote => ({ ...emote, channelId: key }))];
				}
				for (const [key, value] of Object.entries(customEmotes?.bttv?.bttvEmotes || {})) {
					allEmotes.push({ code: key, name: value, char: key, bttv: true });
				}
				for (const [key, value] of Object.entries(customEmotes?.ffz?.ffzEmotes || {})) {
					allEmotes.push({ code: key, name: value, char: key, ffz: true });
				}
				setUserEmotes(allEmotes);
			}
		})();
	}, [userInfo, channel]);

	const flagMatches = useMemo(
		() =>
			handleFlags(showSearch ? search : "", [...messages, ...pinnedMessages])
				.filter(msg => !msg.deleted)
				.filter(msg => (msg.autoMod ? settings.ShowAutomodMessages && isMod : true))
				.sort((a, b) => a.sentAt - b.sentAt)
				.map(message => ({ ...message, moddable: message.moddable && isMod })),
		[messages, search, showSearch, pinnedMessages, isMod, settings]
	);

	const sendMessage = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.emit("sendchat", {
				sender: userInfo?.name?.toLowerCase?.(),
				message: chatValue,
			});
		}
	}, [socketRef, chatValue, userInfo]);

	return showViewers ? (
		<span style={{ fontFamily: settings.Font }}>
			<Viewers isMod={isMod} streamer={streamerName} chatterCount={chatterCount} chatterInfo={chatterInfo} />
		</span>
	) : (
		<div
			style={{ fontFamily: settings.Font, fontSize: `${settings.FontScaling || 1}rem` }}
			ref={bodyRef}
			className={`overlay-container ${settings.ShowScrollbar && windowFocused ? "scroll-bar" : ""}`}
		>
			<div className={`overlay ${settings?.ReverseMessageOrder ? "reversed" : ""} ${windowFocused ? "focused" : "unfocused"}`}>
				<CSSTransition unmountOnExit classNames="chat-node" timeout={200} in={windowFocused}>
					<div
						id="chat-input--container"
						onClick={() => {
							document.getElementById("chat-input").focus();
						}}
					>
						<ReactTextareaAutocomplete
							onItemHighlighted={({ item }) => {
								setTimeout(() => {
									const name = item?.name;
									const node = document.getElementById(name);
									if (node) {
										const _ = node.parentNode?.parentNode?.parentNode?.scrollTo?.({
											top: node?.offsetTop,
											left: 0,
											behavior: "smooth",
										});
									}
								}, 100);
							}}
							movePopupAsYouType
							loadingComponent={() => <span>Loading</span>}
							minChar={2}
							listClassName="auto-complete-dropdown"
							trigger={{
								"@": {
									dataProvider: token => {
										return allChatters
											.filter(chatter => chatter.startsWith(token))
											.map(chatter => ({ name: `${chatter}`, char: `@${chatter}` }));
									},
									component: UserItem,
									output: (item, trigger) => item.char,
								},
								":": {
									dataProvider: token => {
										return userEmotes
											.filter(emote => emote?.code?.toLowerCase?.()?.includes?.(token?.toLowerCase?.()))
											.map(emote => ({
												name: `${emote.id || emote.name}`,
												char: `${emote.code}`,
												bttv: emote.bttv,
												ffz: emote.ffz,
											}));
									},
									component: EmoteItem,
									output: (item, trigger) => item.char,
								},
							}}
							onKeyPress={e => {
								if (e.which === 13 && !e.shiftKey) {
									sendMessage();
									setChatValue("");
									e.preventDefault();
								}
							}}
							name="chat-input"
							id="chat-input"
							rows="4"
							value={chatValue}
							onChange={e => {
								setChatValue(e.target.value);
							}}
						></ReactTextareaAutocomplete>
						{/* will be used in the future */}
						<Tooltip title="Emote Picker" arrow>
							<img
								src={displayMotes[emoteIndex]}
								onClick={() => {
									setEmotePickerVisible(prev => !prev);
								}}
								onMouseEnter={() => {
									setEmoteIndex(Math.floor(Math.random() * displayMotes.length));
								}}
								alt=""
							/>
						</Tooltip>
					</div>
				</CSSTransition>
				<Messages
					deny={denyMessage}
					accept={acceptMessage}
					messages={flagMatches}
					settings={settings}
					timeout={timeout}
					removeMessage={removeMessage}
					ban={ban}
					unreadMessageHandler={checkReadMessage}
					pin={pinMessage}
				/>
				<CSSTransition unmountOnExit timeout={200} classNames="search-node" in={showSearch && windowFocused ? true : !!search.length}>
					<SearchBox
						onKeyDown={e => {
							if (e.key === "Escape") {
								setShowSearch(false);
							}
						}}
						id="chat-search"
						value={search}
						onChange={handleSearch}
						placeHolder="Search Messages"
					/>
				</CSSTransition>
			</div>

			<CSSTransition unmountOnExit timeout={400} classNames={"to-top-node"} in={showToTop && windowFocused}>
				<button className="back-to-top-button fade-in" onClick={scrollTop}>
					Scroll To {settings?.ReverseMessageOrder ? "Bottom" : "Top"}
				</button>
			</CSSTransition>
			<EmotePicker
				onEmoteSelect={emote => setChatValue(prev => `${prev} ${emote}`)}
				emotes={userEmotes}
				onClickAway={() => setEmotePickerVisible(false)}
				visible={emotePickerVisible && windowFocused}
			/>
		</div>
	);
}

export default React.memo(App);
