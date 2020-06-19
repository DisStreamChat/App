import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import firebase from "./firebase";

import Home from "./App";
import Auth from "./components/Auth";
import "bootstrap/dist/css/bootstrap.min.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "react-loader";
import { AppContext } from "./contexts/AppContext";
import Channels from "./components/Channels";
const { ipcRenderer } = window.require("electron");

const App = () => {
	const [firebaseInit, setFirebaseInit] = useState(false);
	const [userId, setUserId] = useState("");
	const [streamerInfo, setStreamerInfo] = useState({});
	const [messages, setMessages] = useState();
	const [border, setBorder] = useState(true);

	const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		ipcRenderer.send("setclickthrough", "f6");
		ipcRenderer.send("setunclickthrough", "f7");
	}, []);

	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(currentUser?.uid || " ")
			.onSnapshot(snapshot => {
				const data = snapshot.data();
				if (data) {
					const opacity = data.appSettings.ClickThroughOpacity;
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

	useEffect(() => {
		ipcRenderer.on("toggle-border", (event, text) => {
			setBorder(text);
		});
	}, []);

	useEffect(() => {
		(async () => {
			if (firebaseInit !== false) {
				const userData = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
				const profilePictureResponse = await fetch(`${process.env.REACT_APP_SOCKET_URL}/profilepicture?user=${userData?.TwitchName}`);
				const profilePicture = await profilePictureResponse.json();
				const modChannelResponse = await fetch(`${process.env.REACT_APP_SOCKET_URL}/modchannels?user=${userData?.TwitchName}`);
				const ModChannels = await modChannelResponse.json();
				firebase.db.collection("Streamers").doc(currentUser.uid).update({
                    profilePicture,
                    ModChannels
				});
			}
		})();
	}, [firebaseInit, currentUser]);

	// vanilla dom in react 🤮
	useEffect(() => {
		if (border && streamerInfo?.appSettings?.ShowBorder) {
			document.body.classList.add("boarder");
		} else {
			document.body.classList.remove("boarder");
		}
	}, [border, streamerInfo]);

	useEffect(() => {
		if (currentUser) {
			(async () => {
				const db = firebase.db;
				const unsubscribe = db
					.collection("Streamers")
					.doc(currentUser.uid)
					.onSnapshot(snapshot => {
						setStreamerInfo(snapshot.data());
					});
				return () => unsubscribe();
			})();
		}
	}, [setStreamerInfo, currentUser]);

	return firebaseInit !== false ? (
		<AppContext.Provider
			value={{
				userId,
				messages,
				setUserId,
				setMessages,
				streamerInfo,
				setStreamerInfo,
			}}
		>
			<Router>
				<Switch>
					<ProtectedRoute exact path="/chat/:id" component={Home} />
					<ProtectedRoute path="/channels" component={Channels} />
					<Route path="/login" component={Auth} />
					<Redirect to="/channels" />
				</Switch>
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
