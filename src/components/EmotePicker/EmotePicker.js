import React, { memo, useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import "./EmotePicker.scss";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { Tooltip } from "@material-ui/core";

const EmoteItem = ({ name, char, bttv, ffz, onClick }) => {
	return (
		<Tooltip title={char} placement="top" arrow>
			<img
                onClick={() => {
                    if(onClick) onClick(char)
                }}
				title={char}
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
	return (
		<CSSTransition in={visible} timeout={400} unmountOnExit classNames="emote-picker-node">
			<ClickAwayListener
				onClickAway={() => {
					if (onClickAway) onClickAway();
				}}
			>
				<div className="emote-picker">
					<div className="emote-picker__header"></div>
					<div className="emote-picker__body">
						{emotes?.map(emote => (
							<EmoteItem onClick={onEmoteSelect} {...emote} name={emote.id} char={emote.code} />
						))}
					</div>
					<div className="emote-picker__footer"></div>
				</div>
			</ClickAwayListener>
		</CSSTransition>
	);
});

export default EmotePicker;
