import React, { useState, useEffect, useContext } from "react";
// import firebase from "../firebase";
import "./Viewer.scss";
import { AppContext } from "../contexts/AppContext";
import ClearTwoToneIcon from "@material-ui/icons/ClearTwoTone";
import Loader from "react-loader";
import { ContextMenu,  ContextMenuTrigger } from "react-contextmenu";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import BlockIcon from "@material-ui/icons/Block";
import AccessTimeIcon from "@material-ui/icons/AccessTime";

//TODO: load data on click
const ViewerCard = ({ ban, timeout, isMod, login, ...props }) => {
	const [clicked, setClicked] = useState();
	const [viewerData, setViewerData] = useState({});
	// const [loading, setLoading] = useState()

	useEffect(() => {
		(async () => {
			if (clicked) {
				console.log("getting data");
				const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${login}&platform=twitch`);
				if (response.ok) {
					try {
						setViewerData(await response.json());
					} catch (err) {
						alert(err.message);
					}
				}
			}
		})();
	}, [clicked, login]);

	return (
		<div className="viewer-card">
			<ContextMenuTrigger id={props.id}>{login}</ContextMenuTrigger>
			<ContextMenu onShow={() => setClicked(true)} id={props.id}>
				<div className="viewer-context">
					<div className="viewer-header">
						<div className="viewer-info">
							<img src={viewerData.profile_image_url} alt="" />
							{login}
						</div>
						<div className="viewer-icon">
							<a href={`https://www.twitch.tv/popout/${props.streamer}/viewercard/${props.login}?popout=`}>
								<ExitToAppIcon />
							</a>
						</div>
					</div>
					<div className="viewer-body">
						<div className="mod-icons">
							{isMod && (
								<>
									<div onClick={() => ban(props.id, "twitch")} data-title={`Ban ${props.id}`}>
										<BlockIcon />
									</div>
									<div onClick={() => timeout(props.id, "twitch")} data-title={`Timeout ${props.id}`}>
										<AccessTimeIcon />
									</div>
									<div  onClick={() => timeout(props.id, "twitch", 1)} data-title={`Purge User`}>1s</div>
									<div  onClick={() => timeout(props.id, "twitch", 600)} data-title={`Timeout 10min`}>10m</div>
									<div  onClick={() => timeout(props.id, "twitch", 3600)} data-title={`Timeout 1hr`}>1h</div>
									<div  onClick={() => timeout(props.id, "twitch", 28800)} data-title={`Timeout 8hr`}>8h</div>
									<div  onClick={() => timeout(props.id, "twitch", 86400)} data-title={`Timeout 24hr`}>24h</div>
								</>
							)}
						</div>
					</div>
				</div>
			</ContextMenu>
		</div>
	);
};

const Viewers = ({ ban, timeout, isMod, chatterInfo, chatterCount, streamer }) => {
	const [tab, setTab] = useState("twitch");
	const [displayChatters, setDisplayChatters] = useState();
	const { setShowViewers } = useContext(AppContext);
	// const currentUser = firebase.auth.currentUser;

	useEffect(() => {
		setTimeout(() => {
			setDisplayChatters(chatterInfo);
		}, 10);
	}, [chatterInfo]);

	return (
		<main className="viewer-body">
			<nav className="viewers-header">
				<button onClick={() => setShowViewers(false)}>
					<ClearTwoToneIcon />
				</button>
				<div
					onClick={() => {
						setTab("twitch");
					}}
					className={`platform-tab ${tab === "twitch" ? "open" : ""}`}
					id="twitch-tab"
				>
					Twitch
				</div>
				{/* <div
					onClick={() => {
						setTab("discord");
					}}
					className={`platform-tab ${tab === "discord" ? "open" : ""}`}
					id="discord-tab"
				>
					Discord
				</div> */}
			</nav>
			<div className="viewers">
				{tab === "twitch" ? (
					displayChatters ? (
						Object.entries(displayChatters).map(([key, value]) => {
							return (
								<div key={key} className="viewer-type">
									<h2 className="viewer-type--header">{key}</h2>
									{value.map(user => (
										<ViewerCard ban={ban} timeout={timeout} isMod={isMod} key={user.id} streamer={streamer} {...user}></ViewerCard>
									))}
								</div>
							);
						})
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
							speed={1.25}
							trail={60}
							shadow={true}
							hwaccel={true}
							className="spinner"
							zIndex={2e9}
							top="50%"
							left="50%"
							scale={2.0}
							loadedClassName="loadedContent"
						/>
					)
				) : (
					<></>
				)}
			</div>
		</main>
	);
};

export default Viewers;
