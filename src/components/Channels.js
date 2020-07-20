import React, { useState, useEffect, useContext } from "react";
import firebase from "../firebase";
import { AppContext } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import "./Channels.scss";
const { ipcRenderer } = window.require("electron");

const ChannelItem = props => {
	return (
		<div className="channel-item">
			<div className="channel-profile-pic">
				<img src={props["profile_image_url"] || props.profilePicture} alt="" />
			</div>
			<div className="channel-info">
				<span className="channel-name">{props.display_name || props.name}</span>
				<span className="channel-buttons">
					<Link className="dashboard-link" to={props.isMember ? `/chat/${props.uid}` : ""}>
						<button disabled={!props.isMember} className="to-dashboard dashboard-button">
							{props.isMember ?  "Go To Chat" : <>This channel doesn't use DisStreamChat</>}
						</button>
					</Link>
					{props.isMember && (
						<button
							onClick={() => ipcRenderer.send("popoutChat", props.uid)}
							className="to-dashboard dashboard-button"
						>
							{props.isMember ? "Popout Chat" : <>This channel doesn't use DisStreamChat</>}
						</button>
					)}
				</span>
			</div>
		</div>
	);
};

const Channels = props => {
	const currentUser = firebase.auth.currentUser;
	const [myChannel, setMyChannel] = useState();
	const [modChannels, setModChannels] = useState([]);
    const { setMessages, setPinnedMessages } = useContext(AppContext);
    
    useEffect(() => {
        ipcRenderer.on("popout", (event, data) => {
            props.history.push(`/chat/${data}?popout=${data}`)
        })
    }, [props.history])

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
				const channelsInfo = (await firebase.db.collection("Streamers").doc(currentUser.uid).get()).data().ModChannels;
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
			}
		})();
	}, [currentUser]);

	return (
		<>
			<div className="my-channels">
				<div className="mychannel channel-div">
					<h1>Your Channel</h1>
					<ChannelItem {...myChannel} />
				</div>
				<hr />
				<h1>Channels you moderate</h1>
				<div className="modchannels channel-div">
					{modChannels.map(channel => (
						<ChannelItem {...channel} moderator />
					))}
				</div>
			</div>
		</>
	);
};

export default Channels;
