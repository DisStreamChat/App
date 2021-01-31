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
import { useLocalStorage  } from "react-use";
import { useMemo } from "react";

const { ipcRenderer } = window.require("electron");

const ChannelItem = React.memo(props => {
	const [channelName, setChannelName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const { userData } = useContext(AppContext);
	const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		if (!props.addChannel) {
			setChannelName(props.display_name || props.name);
		}
	}, [props, setChannelName]);

	const getLive = useCallback(async () => {
		if (channelName && !props.addChannel) {
			const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=${channelName?.toLowerCase?.()}&new=true`;
			const response = await fetch(ApiUrl);
			const data = await response.json();
			setIsLive(() => data?.isLive && channelName);
		}
	}, [channelName, props]);

	useEffect(() => {
		getLive();
	}, [getLive]);

	const removeChannel = useCallback(async () => {
		const Append = firebase.firestore.FieldValue.arrayUnion;
		const userRef = firebase.db.collection("Streamers").doc(currentUser.uid);
		const modChannels = userData.ModChannels;
		const newModChannels = modChannels.filter(channel => channel.id !== props.id);
		props.setModChannels(prev => prev.filter(channel => channel.id !== props.id));
		await userRef.update({
			ModChannels: newModChannels,
			removedChannels: Append(props.id),
		});
	}, [currentUser, props, userData]);

	const pinChannel = useCallback(async () => {
		const Append = firebase.firestore.FieldValue.arrayUnion;
		const userRef = firebase.db.collection("Streamers").doc(currentUser.uid);
		props.setPinnedChannels(prev => [...prev, props.id]);
		await userRef.update({
			pinnedChannels: Append(props.id),
		});
	}, [currentUser, props]);

	const unpinChannel = useCallback(async () => {
		const Filter = firebase.firestore.FieldValue.arrayRemove;
		const userRef = firebase.db.collection("Streamers").doc(currentUser.uid);
		props.setPinnedChannels(prev => prev.filter(id => id !== props.id));
		await userRef.update({
			pinnedChannels: Filter(props.id),
		});
	}, []);

	useInterval(getLive, 60000 * 4);

	const addChannel = useCallback(
		async e => {
			e.preventDefault();
			setError("");
			try {
				setLoading(true);
				if (!channelName) {
					setError("Missing Channel Name");
				} else {
					const userName = userData.name;
					const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${channelName}&platform=twitch`;
					const res = await fetch(apiUrl);
					if (!res.ok) {
						setError(`An error occured while fetching ${channelName}, make sure you entered the name correctly`);
					} else {
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
				}
			} catch (err) {
				setError(`An error occured while fetching ${channelName}, make sure you entered the name correctly`);
			}
			setChannelName("");
			setLoading(false);
		},
		[channelName, currentUser.uid, userData]
	);

	return (
		<div className={`channel-item ${props.addChannel ? "add-channel" : ""}`}>
			{props.addChannel ? (
				<>
					<h5>Add Channel</h5>
					<form onSubmit={addChannel}>
						<SearchBox onClick={() => setError("")} onChange={setChannelName} value={channelName} placeholder="Enter Channel Name" />
						<button className="dashboard-button to-dashboard">{!loading ? "Submit" : "Loading..."}</button>
					</form>
					{error && <p className="error-message">{error}</p>}
				</>
			) : (
				<>
					{!props.mine && (
						<>
							<Tooltip title="Remove Channel" arrow placement="top">
								<button onClick={removeChannel} className="channel-btn remove-btn">
									<ClearIcon />
								</button>
							</Tooltip>
							<Tooltip title={`${props.pinned ? "Unpin Channel" : "Pin Channel"}`} arrow placement="top">
								<button onClick={props.pinned ? unpinChannel : pinChannel} className="channel-btn pin-btn">
									<img src={`${process.env.PUBLIC_URL}/${props.pinned ? "unpin.svg" : "pin.svg"}`} alt="" />
								</button>
							</Tooltip>
						</>
					)}
					<div className={`channel-profile-pic ${isLive ? "live" : ""}`}>
						<img src={props["profile_image_url"] || props.profilePicture} alt="" />
					</div>
					<div className="channel-info">
						<span className="channel-name">{channelName}</span>
						{props.popoutChat ? (
							<button onClick={() => ipcRenderer.send("popoutChat", props.id)} className="to-dashboard dashboard-button">
								{"Popout Chat"}
							</button>
						) : (
							<Link className="dashboard-link" to={`/chat/${props.id}`}>
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
	const [myChannel, setMyChannel] = useState();

	const {
		setMessages,
		setPinnedMessages,
		setShowViewers,
		userData,
		setUnreadMessageIds,
		streamerInfo,
		modChannels,
		setModChannels,
		pinnedChannels,
		setPinnedChannels,
	} = useContext(AppContext);
	const [popout, setPopout] = useState(false);

	useEffect(() => {
		ipcRenderer.on("popout", (event, data) => {
			props.history.push(`/chat/${data}?popout=${data}`);
		});
		ipcRenderer.on("popoutViewers", (event, data) => {
			props.history.push(`/viewers/${data}?popout=${data}`);
		});
		ipcRenderer.on("openSettings", () => {
			alert("settings")
			props.history.push("/settings")
		})
	}, [props.history]);

	useEffect(() => {
		setMessages([]);
		setPinnedMessages([]);
		setShowViewers(false);
		setUnreadMessageIds([]);
	}, [setMessages, setPinnedMessages, setShowViewers, setUnreadMessageIds]);

	useEffect(() => {
		const user = userData;
		setMyChannel({ name: user?.displayName, isMember: true, profilePicture: user?.profilePicture, uid: user.uid, id: user.twitchId || user.discordId });
	}, [userData]);

	useEffect(() => {
		setPinnedChannels(userData.pinnedChannels);
	}, [userData]);

	const uid = userData.uid;
	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(uid || " ")
			.onSnapshot(snapshot => {
				const data = snapshot.data();
				if (!data) return;
				setModChannels(
					data.ModChannels?.sort((a, b) => a.login.localeCompare(b.login))
						?.sort((a, b) => ((pinnedChannels || []).includes(a.id) ? -1 : 1))
						?.map(channel => {
							return { ...channel, pinned: (pinnedChannels || []).includes(channel?.id), modPlatform: "twitch", uid: sha1(channel.id) };
						})
				);
			});
		return unsub;
	}, [uid, setModChannels, userData, pinnedChannels]);

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

    // console.log(myChannel)

	return (
		<>
			<div className="my-channels">
				<div className="mychannel channel-div">
					<h1>Your Channel</h1>
					<ChannelItem mine popoutChat={popout} {...myChannel} />
				</div>
				<hr />
				<h1>Saved Channels</h1>
				<div className={`modchannels channel-div ${streamerInfo.CompactChannels ? "compact-channels" : ""}`}>
					{modChannels ? (
						modChannels?.map?.(channel => (
							<ChannelItem
								setPinnedChannels={setPinnedChannels}
								setModChannels={setModChannels}
								popoutChat={popout}
								key={channel.id}
								{...channel}
								moderator
							/>
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
				{<ChannelItem addChannel />}
			</div>
		</>
	);
});

export default Channels;
