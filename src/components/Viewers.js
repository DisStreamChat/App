import React, { useState, useEffect, useContext } from "react";
import firebase from "../firebase";
import "./Viewer.scss";
import { AppContext } from "../contexts/AppContext";
import ClearTwoToneIcon from "@material-ui/icons/ClearTwoTone";
import Loader from "react-loader";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import BlockIcon from "@material-ui/icons/Block";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import { Tooltip } from "@material-ui/core";

const ViewerTab = props => {};

const ViewerCard = props => {
	console.log(props);
	return (
		<div className="viewer-card">
			<ContextMenuTrigger id={props.id}>{props.login}</ContextMenuTrigger>
			<ContextMenu id={props.id}>
				<div className="viewer-context">
					<div className="viewer-header">
						<div className="viewer-info">
							<img src={props.profile_image_url} alt="" />
							{props.login}
						</div>
						<div className="viewer-icon">
							<a href={`https://www.twitch.tv/popout/${props.streamer}/viewercard/${props.login}?popout=`}>
								<ExitToAppIcon />
							</a>
						</div>
					</div>
					<div className="viewer-body">
						<div className="mod-icons">
							<div title={`Ban ${props.login}`}>
								<BlockIcon />
							</div>
							<div title={`Timeout ${props.login}`}>
								<AccessTimeIcon />
							</div>
							<div title={`Purge User`}>
								1s
							</div>
							<div title={`Timeout 10min`}>
								10m
							</div>
							<div title={`Timeout 1hr`}>
								1h
							</div>
							<div title={`Timeout 8hr`}>
								8h
							</div>
							<div title={`Timeout 24hr`}>
								24h
							</div>
						</div>
					</div>
				</div>
			</ContextMenu>
		</div>
	);
};

const Viewers = ({ chatterInfo, chatterCount, streamer }) => {
	const [tab, setTab] = useState("twitch");
	const { setShowViewers } = useContext(AppContext);
	const currentUser = firebase.auth.currentUser;

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
					chatterInfo ? (
						Object.entries(chatterInfo).map(([key, value]) => {
							return (
								<div key={key} className="viewer-type">
									<h2 className="viewer-type--header">{key}</h2>
									{value.map(user => (
										<ViewerCard key={user.id} streamer={streamer} {...user}></ViewerCard>
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
