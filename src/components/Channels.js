import React, { useState, useEffect, useContext, useCallback } from "react";
import firebase from "../firebase";
import { AppContext } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import "./Channels.scss";
import SearchBox from "./SearchBox";
import { useInterval } from "react-use";
import ClearIcon from "@material-ui/icons/Clear";
import { Tooltip } from "@material-ui/core";
import Loader from "react-loader";
import sha1 from "sha1";
const { ipcRenderer } = window.require("electron");

const ChannelItem = React.memo(props => {
	const [channelName, setChannelName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		if (!props.addChannel) {
			setChannelName(props.display_name || props.name);
		}
	}, [props]);

	const getLive = useCallback(async () => {
		if (channelName) {
			const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=${channelName?.toLowerCase?.()}&new=true`;
			const response = await fetch(ApiUrl);
			const data = await response.json();
			setIsLive(() => data?.isLive && channelName);
		}
	}, [channelName]);

	useEffect(() => {
		getLive();
	}, [getLive]);

	const removeChannel = useCallback(async () => {
		const Append = firebase.firestore.FieldValue.arrayUnion;
		const userRef = firebase.db.collection("Streamers").doc(currentUser.uid);
		const modChannels = (await userRef.get()).data().ModChannels;
		const newModChannels = modChannels.filter(channel => channel.id !== props.id);
		props.setModChannels(prev => prev.filter(channel => channel.id !== props.id));
		await userRef.update({
			ModChannels: newModChannels,
			removedChannels: Append(props.id),
		});
	}, [currentUser, props]);

	useInterval(getLive, 60000);

	return (
		<div className={`channel-item ${props.addChannel ? "add-channel" : ""}`}>
			{props.addChannel ? (
				<>
					<h5>Add Channel</h5>
					<form
						onSubmit={async e => {
							e.preventDefault();
							setError("");
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
							setChannelName("");
							setLoading(false);
						}}
					>
						<SearchBox onClick={() => setError("")} onChange={setChannelName} value={channelName} placeholder="Enter Channel Name" />
						<button className="dashboard-button to-dashboard">{!loading ? "Submit" : "Loading..."}</button>
					</form>
					{error && <p className="error-message">{error}</p>}
				</>
			) : (
				<>
					{!props.mine && (
						<Tooltip title="Remove Channel" arrow placement="top">
							<button onClick={removeChannel} className="remove-btn">
								<ClearIcon />
							</button>
						</Tooltip>
					)}
					<div className={`channel-profile-pic ${isLive ? "live" : ""}`}>
						<img src={props["profile_image_url"] || props.profilePicture} alt="" />
					</div>
					<div className="channel-info">
						<span className="channel-name">{channelName}</span>
						{props.popoutChat ? (
							props.isMember && (
								<button onClick={() => ipcRenderer.send("popoutChat", props.uid)} className="to-dashboard dashboard-button">
									{"Popout Chat"}
								</button>
							)
						) : (
							<Link className="dashboard-link" to={`/chat/${props.uid}`}>
								<button className="to-dashboard dashboard-button">{"Go To Chat"}</button>
							</Link>
						)}
					</div>
				</>
			)}
		</div>
	);
});

const Channels = React.memo(props => {
	const currentUser = firebase.auth.currentUser;
	const [myChannel, setMyChannel] = useState();
	const [modChannels, setModChannels] = useState([]);
	const { setMessages, setPinnedMessages, setShowViewers } = useContext(AppContext);
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
		setShowViewers(false);
	}, [setMessages, setPinnedMessages, setShowViewers]);

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
						setModChannels(
							channelsInfo
								.sort((a, b) => a.login.localeCompare(b.login))
								.map(channel => {
									return { ...channel, modPlatform: "twitch", uid: sha1(channel.id) };
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
		document.addEventListener("focusout", handleKeyUp);
		return () => {
			document.removeEventListener("keyup", handleKeyUp);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("focusout", handleKeyUp);
		};
	}, []);

	return (
		<>
			<div className="my-channels">
				<div className="mychannel channel-div">
					<h1>Your Channel</h1>
					<ChannelItem mine popoutChat={popout} {...myChannel} />
				</div>
				<hr />
				<h1>Channels you moderate</h1>
				<div className="modchannels channel-div">
					{modChannels.length ? (
						modChannels.map(channel => (
							<ChannelItem setModChannels={setModChannels} popoutChat={popout} key={channel.id} {...channel} moderator />
						))
					) : (
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
							scale={1.75}
							loadedClassName="loadedContent"
						/>
					)}
				</div>
				{!!modChannels.length && <ChannelItem addChannel />}
			</div>
		</>
	);
});

export default Channels;
