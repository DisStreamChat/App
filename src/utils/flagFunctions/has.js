const ParamRegexes = {
	link: /<a [^<]*>[^>]*<\/a>/gim,
	emote: /<img [^<]*>/gim,
};
const validParams = Object.keys(ParamRegexes);

module.exports = (parameter, messages) => {
	if (!validParams.includes(parameter)) return messages;
	return messages.filter(message => message.body.match(ParamRegexes[parameter]));
};
