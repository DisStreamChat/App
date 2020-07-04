import React, { useEffect, useState, useCallback, useRef } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";
import openSocket from "socket.io-client";
import { Message } from "distwitchchat-componentlib";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import SearchBox from "./SearchBox";
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {CSSTransition} from "react-transition-group"
import RateReviewIcon from '@material-ui/icons/RateReview';
import "./Chat.css";
import "./Message.css";
import "distwitchchat-componentlib/dist/index.css";

const Messages = React.memo(props => {
	return (
		<>
			{props.messages.map((msg, i) => (
				<Message index={msg.id} forwardRef={props.unreadMessageHandler} streamerInfo={props.settings} delete={props.removeMessage} key={msg.id} msg={msg} />
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
    const [showToTop, setShowToTop] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(false)
    const bodyRef = useRef()
    const observerRef = useRef()
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
				setMessages(m => [...m.slice(-Math.max(settings.MessageLimit, 100)), {...msg, read: false}]);
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
    
    const scrollTop = useCallback(() => {
        bodyRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }, [])

    useEffect(() => {
        bodyRef.current.addEventListener("scroll", e => {
            setShowToTop(prev => bodyRef.current.scrollTop > 600)
        })
    }, [])

    const checkReadMessage = useCallback(node => {
        if(!node)return
        if(!observerRef.current){
            observerRef.current = new IntersectionObserver(entries => {
                entries.forEach((entry, i) => {
                    if(entry.isIntersecting){
                        setMessages(prev => {
                            const copy = [...prev]
                            copy[copy.findIndex(msg => msg.id ===entry.target.dataset.idx)].read = true
                            return copy
                        })
                        observerRef.current.unobserve(entry.target);
                    }
                })
            })
        }
        if(observerRef.current && node){
            try{

                observerRef.current.observe(node)
            }catch(err){
                console.log(node)
            }
        }
    }, [observerRef, setMessages])

    useEffect(() => {
        setTimeout(() => {
            setUnreadMessages(!!messages.find(msg => !msg.read && !msg.deleted))
        }, 500)
    }, [messages])

    const markAsRead = useCallback(() => {
        setMessages(prev => prev.map(msg => ({...msg, read: true})))
        setUnreadMessages(false)
    }, [setMessages])

	return (
		<div ref={bodyRef} className="overlay-container">
            <CSSTransition unmountOnExit timeout={400} classNames={"unread-node"} in={unreadMessages}>
                <div className="unread-notification">
                    <span>You have unread messages</span>
                    <button onClick={markAsRead}>Mark as read</button>
                </div>
            </CSSTransition>
			<div className="overlay">
				<Messages
					messages={messages
						.filter(msg => !search || msg.body.toLowerCase().includes(search.toLowerCase()))
						.sort((a, b) => a.sentAt - b.sentAt)}
					settings={settings}
                    removeMessage={removeMessage}
                    unreadMessageHandler={checkReadMessage}
				/>
				<SearchBox onChange={handleSearch} placeHolder="Search Messages" />
			</div>
            <CSSTransition unmountOnExit timeout={400} classNames={"to-top-node"} in={showToTop}>
                <button className="back-to-top-button fade-in" onClick={scrollTop}><KeyboardArrowUpIcon></KeyboardArrowUpIcon></button>
            </CSSTransition>
		</div>
	);
}

export default React.memo(App);
