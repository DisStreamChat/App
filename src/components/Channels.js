import React, { useState, useEffect, useContext } from "react";
import firebase from "../firebase";
import { AppContext } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import "./Channels.scss";
import SearchBox from "./SearchBox";
const { ipcRenderer } = window.require("electron");

const ChannelItem = props => {
	const [channelName, setChannelName] = useState("");
	const currentUser = firebase.auth.currentUser;
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	return (
		<div className={`channel-item ${props.addChannel ? "add-channel" : ""}`}>
			{props.addChannel ? (
				<>
					<h5>Add Channel</h5>

					<form
						onSubmit={async e => {
							e.preventDefault();
							try {
								setLoading(true);
								if (!channelName) {
									setError("Missing Channel Name");
								} else {
									const userData = await (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data();
									const userName = userData.name;
									const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/checkmod?channel=${channelName}&user=${userName}`;
									const res = await fetch(apiUrl);
									const json = await res.json();
									if (json) {
										const ModChannels = [...userData.ModChannels, json].filter(
											(thing, index, self) => index === self.findIndex(t => t.id === thing.id)
										);
										await firebase.db.collection("Streamers").doc(currentUser.uid).update({
											ModChannels,
										});
									} else {
										setError("You are not a moderator for " + channelName);
									}
								}
							} catch (err) {
								setError("An error occured while fetching " + channelName);
							}
							setLoading(false);
						}}
					>
						<SearchBox onClick={() => setError("")} onChange={setChannelName} placeholder="Enter Channel Name" />
						<button className="dashboard-button to-dashboard">{!loading ? "Submit" : "Loading..."}</button>
					</form>
					{error && <p className="error-message">{error}</p>}
				</>
			) : (
				<>
					<div className="channel-profile-pic">
						<img src={props["profile_image_url"] || props.profilePicture} alt="" />
					</div>
					<div className="channel-info">
						<span className="channel-name">{props.display_name || props.name}</span>
						<span className="channel-buttons">
							{props.popoutChat ? (
								props.isMember && (
									<button onClick={() => ipcRenderer.send("popoutChat", props.uid)} className="to-dashboard dashboard-button">
										{props.isMember ? "Popout Chat" : <>This channel doesn't use DisStreamChat</>}
									</button>
								)
							) : (
								<Link className="dashboard-link" to={props.isMember ? `/chat/${props.uid}` : ""}>
									<button disabled={!props.isMember} className="to-dashboard dashboard-button">
										{props.isMember ? "Go To Chat" : <>This channel doesn't use DisStreamChat</>}
									</button>
								</Link>
							)}
						</span>
					</div>
				</>
			)}
		</div>
	);
};

const Channels = props => {
	const currentUser = firebase.auth.currentUser;
	const [myChannel, setMyChannel] = useState();
	const [modChannels, setModChannels] = useState([]);
	const { setMessages, setPinnedMessages } = useContext(AppContext);
	const [popout, setPopout] = useState(false);

	useEffect(() => {
		ipcRenderer.on("popout", (event, data) => {
			props.history.push(`/chat/${data}?popout=${data}`);
		});
		ipcRenderer.on("popoutViewers", (event, data) => {
			props.history.push(`/viewers/${data}?popout=${data}`);
		});
	}, [props.history]);

	useEffect(() => {
		setMessages([]);
		setPinnedMessages([]);
	}, [setMessages, setPinnedMessages]);

	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(currentUser.uid)
			.onSnapshot(snapshot => {
				const user = snapshot.data();
				setMyChannel({ name: user?.displayName, isMember: true, profilePicture: user?.profilePicture, uid: currentUser.uid });
			});
		return () => unsub();
	}, [currentUser]);

	useEffect(() => {
		(async () => {
			if (currentUser) {
				firebase.db
					.collection("Streamers")
					.doc(currentUser.uid)
					.onSnapshot(async snapshot => {
						const data = snapshot.data();
						if (!data) return;
						const channelsInfo = data.ModChannels;
						const channelNames = channelsInfo.map(channel => channel.login);
						const streamerRef = firebase.db.collection("Streamers");
						for (const name of channelNames) {
							const channelData = await streamerRef.where("name", "==", name).get();
							const idx = channelsInfo.findIndex(channel => channel.login === name);
							if (!channelData.empty) {
								channelsInfo[idx].isMember = true;
								const { uid } = channelData.docs[0].data();
								channelsInfo[idx].uid = uid;
							}
						}
						setModChannels(
							channelsInfo
								.sort()
								.sort((a, b) => (a.isMember ? -1 : 1))
								.map(channel => {
									return { ...channel, modPlatform: "twitch" };
								})
						);
					});
			}
		})();
	}, [currentUser]);

	useEffect(() => {
		const handleKeyDown = e => {
			if (e.key === "Control") {
				setPopout(true);
			}
		};
		const handleKeyUp = e => {
			setPopout(false);
		};
		document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        document.addEventListener("focusout", handleKeyUp)
		return () => {
			document.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusout", handleKeyUp)
		};
	}, []);

	return (
		<>
			<div className="my-channels">
				<div className="mychannel channel-div">
					<h1>Your Channel</h1>
					<ChannelItem popoutChat={popout} {...myChannel} />
				</div>
				<hr />
				<h1>Channels you moderate</h1>
				<div className="modchannels channel-div">
					{modChannels
						.sort((a, b) => a.login.localeCompare(b.login))
						.map(channel => (
							<ChannelItem popoutChat={popout} key={channel.id} {...channel} moderator />
						))}
					{!!modChannels.length && <ChannelItem addChannel />}
				</div>
			</div>
		</>
	);
};

export default Channels;
