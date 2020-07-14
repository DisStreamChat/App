const ParamRegexes = {
	link: /<a [^<]*>[^>]*<\/a>/gim,
	emote: /<img [^<]*>/gim,
	emoji: /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gim,
};
const validParams = Object.keys(ParamRegexes);

export default (parameter, messages) => {
	if (!validParams.includes(parameter)) return messages;
	return messages.filter(message => message.body.match(ParamRegexes[parameter]));
};
