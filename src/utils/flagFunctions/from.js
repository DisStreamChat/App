module.exports = (parameter, messages) => {
	return messages.filter(message => message.displayName.toLowerCase().includes(parameter.toLowerCase()));
};
