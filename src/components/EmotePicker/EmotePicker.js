import React, { memo, useState, useMemo } from "react";
import { CSSTransition } from "react-transition-group";
import "./EmotePicker.scss";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { Tooltip } from "@material-ui/core";
import SearchBox from "../SearchBox"

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

const EmotePicker = memo(({ emotes, visible, onClickAway, onEmoteSelect, }) => {
	const [emoteType, setEmoteType] = useState("twitch");
	const [hoveredEmote, setHoveredEmote] = useState()
	const [emoteSearch, setEmoteSearch] = useState("")
	const displayMotes = useMemo(() => {
		return emotes.filter(emote => {
			return emoteType === "twitch" ? !emote.bttv && !emote.ffz : emoteType === "ffz" ? emote.ffz : emoteType === "bttv" ? emote.bttv : true;
		}).filter(emote => emoteSearch ? emote.code.match(new RegExp(emoteSearch.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&'), "i")) : true).sort((a, b) => a.code.localeCompare(b.code, "en", {numeric: true}));
	}, [emotes, emoteType, emoteSearch]);
	return (
		<CSSTransition in={visible} timeout={400} unmountOnExit classNames="emote-picker-node">
			<ClickAwayListener
				onClickAway={() => {
					if (onClickAway) onClickAway();
				}}
			>
				<div className="emote-picker">
					<div className="emote-picker__header">
						<img onClick={() => setEmoteType("twitch")} src="https://static-cdn.jtvnw.net/emoticons/v1/115847/1.0" alt="" />
						<img onClick={() => setEmoteType("bttv")} src="https://cdn.betterttv.net/emote/56e9f494fff3cc5c35e5287e/1x" alt="" />
						<img onClick={() => setEmoteType("ffz")} src="https://cdn.frankerfacez.com/42c1ab2d569b74fd067279096f5ec238.png" alt="" />
						<SearchBox placeholder="Search Emotes" value={emoteSearch} onChange={setEmoteSearch} type="text" className="emote-picker--searchbar"></SearchBox>
					</div>
					<div className="emote-picker__body">
						{displayMotes?.map(emote => (
							<EmoteItem key={emote.id} onMouseEnter={() => setHoveredEmote({...emote, name: emote.name || emote.id})} onMouseLeave={() => setHoveredEmote(null)} onClick={onEmoteSelect} {...emote} name={emote.id || emote.name} char={emote.code} />
						))}
					</div>
					<div className="emote-picker__footer">
						{hoveredEmote ? <>
							<img src={`${hoveredEmote.bttv
						? `https://cdn.betterttv.net/emote/${hoveredEmote.name}/1x#emote`
						: hoveredEmote.ffz
						? `${hoveredEmote.name}#emote`
						: `https://static-cdn.jtvnw.net/emoticons/v1/${hoveredEmote.name}/1.0`}`}>
							</img>
							<div>{hoveredEmote.code}</div>
						</> : <></>}
					</div>
				</div>
			</ClickAwayListener>
		</CSSTransition>
	);
});

export default EmotePicker;
