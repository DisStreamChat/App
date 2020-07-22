import React, { useState, useEffect } from "react";
import firebase from "../firebase";
import { useParams } from "react-router-dom";
import "./Viewer.scss"

const ViewerTab = props => {};

const ViewerCard = props => {
    return (
        <div>{props.login}</div>
    )
};

const Viewers = props => {
	const [chatterInfo, setChatterInfo] = useState({});
	const [chatterCount, setChatterCount] = useState();
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
						if (value.length === 0 || key==="broadcaster") continue;
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
			id = setInterval(getChatters, 45000);
		})();
		return () => clearInterval(id);
	}, [userId]);

	return (
		<div className="viewers">
			{Object.entries(chatterInfo).map(([key, value]) => {
				return (
					<div className="viewer-type">
						<h2>{key}</h2>
						{value.map(user => <ViewerCard {...user}></ViewerCard>)}
					</div>
				);
			})}
		</div>
	);
};

export default Viewers;
