import React, { useState, useEffect, useContext } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";
import "./Viewer.scss";
import { AppContext } from "../contexts/AppContext";
import ClearTwoToneIcon from "@material-ui/icons/ClearTwoTone";
import Loader from "react-loader";

const ViewerTab = props => {};

const ViewerCard = props => {
	return <div className="viewer-card">{props.login}</div>;
};

const Viewers = props => {
	const [chatterInfo, setChatterInfo] = useState();
	const [chatterCount, setChatterCount] = useState();
	const { setShowViewers } = useContext(AppContext);
	const { id: userId } = useParams();

	useEffect(() => {
		let id;
		(async () => {
			const userData = await (await firebase.db.collection("Streamers").doc(userId).get()).data();
			const userName = userData?.TwitchName?.toLowerCase?.();
			const chatterUrl = `${process.env.REACT_APP_SOCKET_URL}/chatters?user=${userName}`;
			const getChatters = async () => {
				const response = await fetch(chatterUrl);
				const json = await response.json();
				if (json && response.ok) {
					const info = {};
					for (let [key, value] of Object.entries(json.chatters)) {
						if (value.length === 0 || key === "broadcaster") continue;
						info[key] = await Promise.all(
							value.map(async name => {
								const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${name}&platform=twitch`);
								return await response.json();
							})
						);
					}

					setChatterInfo(info);
					setChatterCount(json.chatter_count);
				}
			};
			getChatters();
			id = setInterval(getChatters, 60000);
		})();
		return () => clearInterval(id);
	}, [userId]);

	return (
		<main className="viewer-body">
			<nav className="viewers-header">
				<button onClick={() => setShowViewers(false)}>
					<ClearTwoToneIcon />
				</button>
			</nav>
			<div className="viewers">
				{chatterInfo ? (
					Object.entries(chatterInfo).map(([key, value]) => {
						return (
							<div className="viewer-type">
								<h2 className="viewer-type--header">{key}</h2>
								{value.map(user => (
									<ViewerCard {...user}></ViewerCard>
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
				)}
			</div>
		</main>
	);
};

export default Viewers;
