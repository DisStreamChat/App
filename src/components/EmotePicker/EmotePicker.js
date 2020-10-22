import React, { memo, useState, useMemo } from "react";
import { CSSTransition } from "react-transition-group";
import "./EmotePicker.scss";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { Tooltip } from "@material-ui/core";
import SearchBox from "../SearchBox";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";

const EmoteItem = ({ name, char, bttv, ffz, onClick, onMouseEnter, onMouseLeave }) => {
	return (
		<Tooltip title={char} placement="top" arrow>
			<img
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
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
	const customEmojis = useMemo(() => {
		return emotes.map(emote => ({
			id: emote.id || emote.code,
			name: emote.code,
			text: "",
			short_names: [emote.code],
			customCategory: emote.bttv ? "BetterTwitchTv" : emote.ffz ? "FrankerFaceZ" : "Twitch",
			native: emote.code,
			emoticons: [],
			keywords: ["github"],
			imageUrl: emote.bttv
				? `https://cdn.betterttv.net/emote/${emote.name}/1x#emote`
				: emote.ffz
				? `${emote.name}#emote`
				: `https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/1.0`,
		}));
	}, [emotes]);

	return (
		<CSSTransition in={visible} timeout={400} unmountOnExit classNames="emote-picker-node">
			<ClickAwayListener
				onClickAway={() => {
					if (onClickAway) onClickAway();
				}}
			>
				{customEmojis.length ? (
					<Picker
						custom={customEmojis}
                        theme="dark"
                        include={[]}
						style={{ position: "absolute", bottom: "6rem", right: "2rem", zIndex: 100 }}
						set="twitter"
						title="Pick your emote…"
						emoji="point_up"
						onSelect={onEmoteSelect}
					/>
				) : <></>}
			</ClickAwayListener>
		</CSSTransition>
	);
});

export default EmotePicker;
