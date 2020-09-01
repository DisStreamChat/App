import React, { memo, useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";

const EmotePicker = memo(({ emotes, visible }) => {
	return (
		<CSSTransition in={visible} unmountOnExit classNames="emote-picker-node">
			<div className="emote-picker">
				<div className="emote-picker__header"></div>
				<div className="emote-picker__body"></div>
				<div className="emote-picker__footer"></div>
			</div>
		</CSSTransition>
	);
});

export default EmotePicker;
