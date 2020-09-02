import React, { memo, useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import "./EmotePicker.scss";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

const EmotePicker = memo(({ emotes, visible, onClickAway }) => {
	return (
		<CSSTransition in={visible} timeout={400} unmountOnExit classNames="emote-picker-node">
			<ClickAwayListener
				onClickAway={() => {
					if (onClickAway) onClickAway();
				}}
			>
				<div className="emote-picker">
					<div className="emote-picker__header"></div>
					<div className="emote-picker__body"></div>
					<div className="emote-picker__footer"></div>
				</div>
			</ClickAwayListener>
		</CSSTransition>
	);
});

export default EmotePicker;
