import hasFlag from "./has";
import fromFlag from "./from";
import platformFlag from "./platform";
import isFlag from "./is";

const flagRegex = /(\s|^)(has|from|platform|is):([^\s]*)/gim;

const handleFlags = (searchString, messages) => {
	const flags = [...searchString.matchAll(flagRegex)].map(([, , flag, parameter]) => ({ flag, parameter }));
	const flaglessSearch = searchString.replace(flagRegex, "").trim();
	let matchingMessages = [...messages].filter(msg => !flaglessSearch || msg.body.toLowerCase().includes(flaglessSearch.toLowerCase()));
	flags.forEach(({ flag, parameter }) => {
        // could have used switch statement ¯\_(ツ)_/¯
		if (flag === "has") {
			matchingMessages = hasFlag(parameter, matchingMessages);
		} else if (flag === "from") {
			matchingMessages = fromFlag(parameter, matchingMessages);
		} else if (flag === "platform") {
			matchingMessages = platformFlag(parameter, matchingMessages);
		} else if (flag === "is") {
			matchingMessages = isFlag(parameter, matchingMessages);
		}
	});
	return matchingMessages;
};

export default handleFlags