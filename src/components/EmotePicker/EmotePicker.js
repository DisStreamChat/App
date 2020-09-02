import React, { memo, useState, useEffect, useMemo } from "react";
import { CSSTransition } from "react-transition-group";
import "./EmotePicker.scss";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { Tooltip } from "@material-ui/core";

const EmoteItem = ({ name, char, bttv, ffz, onClick }) => {
	return (
		<Tooltip title={char} placement="top" arrow>
			<img
				onClick={() => {
					if (onClick) onClick(char);
				}}
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
		</Tooltip>
	);
};

const EmotePicker = memo(({ emotes, visible, onClickAway, onEmoteSelect }) => {
	const [emoteType, setEmoteType] = useState("twitch");
	const displayMotes = useMemo(() => {
		return emotes.filter(emote => {
			return emoteType === "twitch" ? !emote.bttv && !emote.ffz : emoteType === "ffz" ? emote.ffz : emoteType === "bttv" ? emote.bttv : true;
		});
	}, [emotes, emoteType]);
	return (
		<CSSTransition in={visible} timeout={400} unmountOnExit classNames="emote-picker-node">
			<ClickAwayListener
				onClickAway={() => {
					if (onClickAway) onClickAway();
				}}
			>
				<div className="emote-picker">
					<div className="emote-picker__header">
						<img src="https://static-cdn.jtvnw.net/emoticons/v1/115847/1.0" alt="" />
						<img src="https://cdn.betterttv.net/emote/56e9f494fff3cc5c35e5287e/1x" alt="" />
						<img src="https://cdn.frankerfacez.com/42c1ab2d569b74fd067279096f5ec238.png" alt="" />
					</div>
					<div className="emote-picker__body">
						{displayMotes?.map(emote => (
							<EmoteItem onClick={onEmoteSelect} {...emote} name={emote.id || emote.name} char={emote.code} />
						))}
					</div>
					<div className="emote-picker__footer"></div>
				</div>
			</ClickAwayListener>
		</CSSTransition>
	);
});

export default EmotePicker;
