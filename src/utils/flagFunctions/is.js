export default (parameter, messages) => {
	const parameters = parameter.split(",");
	let matchingMessages = [];
	parameters.forEach(param => {
		matchingMessages = [
			...matchingMessages,
			...messages?.filter(msg =>
				"subscription".includes(param?.toLowerCase?.())
					? msg?.messageType?.toLowerCase?.()?.includes(param.toLowerCase?.()) && msg?.messageType?.toLowerCase?.() !== "channel-points"
					: msg?.messageId?.toLowerCase?.()?.includes(param?.toLowerCase?.()) ||
					  msg?.messageType?.toLowerCase?.()?.includes(param.toLowerCase?.()) ||
					  (msg.pinned && param === "pinned")
			),
		];
	});
	return matchingMessages;
};
