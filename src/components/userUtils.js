import chroma from "chroma-js";

export const types = {
	ShowNameColors: "boolean",
	DiscordColor: "color",
	TwitchColor: "color",
	YoutubeColor: "color",
	HighlightedMessageColor: "color",
	CompactMessages: "boolean",
	MessageLimit: "number",
	DisplayPlatformColors: "boolean",
	DisplayPlatformIcons: "boolean",
	ShowHeader: "boolean",
	ShowBorder: "boolean",
	ClickthroughOpacity: "number",
};

export const colorStyles = {
	container: styles => ({ ...styles, width: "50%", minHeight: 50 }),
	control: (styles, { isDisabled }) => ({
		...styles,
		backgroundColor: isDisabled ? "black" : "#17181b",
		color: "white",
		minHeight: 50,
		opacity: isDisabled ? 0.5 : 1,
	}),
	valueContainer: styles => ({ ...styles, minHeight: 50 }),
	menu: styles => ({ ...styles, backgroundColor: "#17181b" }),
	multiValue: styles => ({
		...styles,
		backgroundColor: chroma("#17181b").brighten(1).css(),
		color: "white",
	}),
	multiValueLabel: styles => ({
		...styles,
		color: "white",
	}),
	multiValueRemove: styles => ({
		...styles,
		color: "white",
	}),
	option: (styles, { data, isDisabled, isFocused, isSelected }) => {
		const color = chroma("#17181b");
		return {
			...styles,
			backgroundColor: isDisabled
				? null
				: isSelected
				? color.brighten(0.6).css()
				: isFocused
				? color.brighten(0.6).css()
				: color.css(),
			color: isDisabled
				? "#ccc"
				: chroma.contrast(color, "white") > 2
				? "white"
				: "black",
			cursor: isDisabled ? "not-allowed" : "default",

			":active": {
				...styles[":active"],
				backgroundColor:
					!isDisabled &&
					(isSelected ? data.color : color.brighten(1).css()),
			},
		};
	},
	singleValue: styles => ({ ...styles, color: "white" }),
};
