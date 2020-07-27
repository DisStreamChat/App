import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import firebase from "./firebase";

import Chat from "./components/Chat";
import Auth from "./components/Auth";
import "bootstrap/dist/css/bootstrap.min.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "react-loader";
import { AppContext } from "./contexts/AppContext";
import Channels from "./components/Channels";
import Header from "./components/Header";
import Viewers from "./components/Viewers";
const { ipcRenderer } = window.require("electron");

const App = () => {
	const [firebaseInit, setFirebaseInit] = useState(false);
	const [streamerInfo, setStreamerInfo] = useState({});
	const [messages, setMessages] = useState([]);
	const [pinnedMessages, setPinnedMessages] = useState([]);
    const [border, setBorder] = useState(true);
    const [showViewers, setShowViewers] = useState(false)
	const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		ipcRenderer.on("toggle-border", (event, text) => {
			setBorder(text);
		});
	}, []);

	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(currentUser?.uid || " ")
			.onSnapshot(snapshot => {
				const data = snapshot.data();
				if (data) {
                    const opacity = data.appSettings.ClickThroughOpacity;
                    const unfocusKey = data.appSettings.UnfocusKeybind
                    const focusKey = data.appSettings.FocusKeybind
                    ipcRenderer.send("setFocus", focusKey || "f7")
                    ipcRenderer.send("setunFocus", unfocusKey || "f6")
					ipcRenderer.send("setopacity", opacity);
				}
			});
		return unsub;
	}, [currentUser]);

	// this allows me to show the loading spinner until firebase is ready
	useEffect(() => {
		(async () => {
			const result = await firebase.isInitialized();
			setFirebaseInit(result);
		})();
	}, []);

	// retrieve the profile picture and mod channels for a user on load
	useEffect(() => {
		(async () => {
			if (firebaseInit !== false && currentUser) {
				const userData = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
				const profilePictureResponse = await fetch(`${process.env.REACT_APP_SOCKET_URL}/profilepicture?user=${userData.TwitchName}`);
				const profilePicture = await profilePictureResponse.json();
				const modChannelResponse = await fetch(`${process.env.REACT_APP_SOCKET_URL}/modchannels?user=${userData.TwitchName}`);
				const NewModChannels = await modChannelResponse.json();
				const ModChannels = [...NewModChannels, ...userData.ModChannels].filter(
					(thing, index, self) => index === self.findIndex(t => t.id === thing.id)
				);
				firebase.db.collection("Streamers").doc(currentUser.uid).update({
					profilePicture,
					ModChannels,
				});
			}
		})();
	}, [firebaseInit, currentUser]);

	// vanilla dom in react 🤮
	useEffect(() => {
		if (border && streamerInfo?.ShowBorder) {
			document.body.classList.add("body--border");
		} else {
			document.body.classList.remove("body--border");
		}
	}, [border, streamerInfo]);

	useEffect(() => {
		if (currentUser) {
			const unsub = firebase.db
				.collection("Streamers")
				.doc(currentUser.uid)
				.onSnapshot(snapshot => {
					const data = snapshot.data();
					if (data) {
						setStreamerInfo(data.appSettings);
					}
				});
			return () => unsub();
		}
	}, [currentUser]);

	return firebaseInit !== false ? (
		<AppContext.Provider
			value={{
				messages,
				setMessages,
				streamerInfo,
				setStreamerInfo,
				pinnedMessages,
                setPinnedMessages,
                showViewers,
                setShowViewers
			}}
		>
			<Router>
				<Header />
				<main className="body">
					<Switch>
						<ProtectedRoute exact path="/chat/:id" component={Chat} />
                        <ProtectedRoute exact path="/viewers/:id" component={Viewers}/>
						<ProtectedRoute path="/channels" component={Channels} />
						<Route path="/login" component={Auth} />
						<Redirect to="/channels" />
					</Switch>
				</main>
			</Router>
		</AppContext.Provider>
	) : (
		<main className="App">
			<Loader
				loaded={false}
				lines={15}
				length={0}
				width={15}
				radius={35}
				corners={1}
				rotate={0}
				direction={1}
				color="#fff"
				speed={1}
				trail={60}
				shadow={true}
				hwaccel={true}
				className="spinner"
				zIndex={2e9}
				top="50%"
				left="50%"
				scale={3.0}
				loadedClassName="loadedContent"
			/>
		</main>
	);
};

ReactDOM.render(<App />, document.getElementById("root"));
