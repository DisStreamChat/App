module.exports = (parameter, messages) => {
	const parameters = parameter.split(",");
	let matchingMessages = [];
	parameters.forEach(param => {
		matchingMessages = [
			...matchingMessages,
			...messages?.filter(
				msg => msg?.messageId?.toLowerCase?.() === param?.toLowerCase?.() || msg?.messageType?.toLowerCase?.() === param.toLowerCase?.() || (msg.pinned && param==="pinned")
			),
		];
	});
	return matchingMessages;
};
