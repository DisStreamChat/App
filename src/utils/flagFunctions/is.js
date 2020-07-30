export default (parameter, messages) => {
	const parameters = parameter.split(",");
	let matchingMessages = [];
	parameters.forEach(param => {
		matchingMessages = [
			...matchingMessages,
			...messages?.filter(
				msg => msg?.messageId?.toLowerCase?.()?.includes( param?.toLowerCase?.()) || msg?.messageType?.toLowerCase?.()?.includes(param.toLowerCase?.()) || (msg.pinned && param==="pinned")
			),
		];
	});
	return matchingMessages;
};
