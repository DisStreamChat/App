import React from "react";
// const Item = ({ selected, entity: { name, char } }) => <div className="auto-item">{`${name}: ${char}`}</div>;
export const UserItem = ({ selected, entity: { name, char } }) => (
	<div id={name} className={`auto-item ${selected ? "selected-item" : ""}`}>{`${name}`}</div>
);

export const EmoteItem = ({ selected, entity: { name, char, bttv, ffz } }) => {
	return (
		<div id={name} className={`emote-item auto-item ${selected ? "selected-item" : ""}`}>
			<img
				className="auto-fill-emote-image"
				src={
					bttv
						? `https://cdn.betterttv.net/emote/${name}/1x#emote`
						: ffz
						? `${name}#emote`
						: `https://static-cdn.jtvnw.net/emoticons/v1/${name}/1.0`
				}
				alt=""
			/>
			{char}
		</div>
	);
};
