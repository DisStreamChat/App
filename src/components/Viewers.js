import React, { useState, useEffect, useContext } from "react";
import firebase from "../firebase";
import "./Viewer.scss";
import { AppContext } from "../contexts/AppContext";
import ClearTwoToneIcon from "@material-ui/icons/ClearTwoTone";
import Loader from "react-loader";

const ViewerTab = props => {};

const ViewerCard = props => {
	return (
		<div>
			<a href={`https://www.twitch.tv/popout/${props.streamer}/viewercard/${props.login}?popout=`} className="viewer-card">
				{props.login}
			</a>
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
								<div className="viewer-type">
									<h2 className="viewer-type--header">{key}</h2>
									{value.map(user => (
										<ViewerCard streamer={streamer} {...user}></ViewerCard>
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
