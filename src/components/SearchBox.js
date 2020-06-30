import React, { useState, useCallback, useEffect } from "react";
import ClearRoundedIcon from "@material-ui/icons/ClearRounded";

const SearchBox = React.memo(({ onChange, placeHolder }) => {
	const [value, setValue] = useState("");

	const handleChange = useCallback(e => {
		setValue(e.target.value);
	}, []);

	useEffect(() => {
		onChange(value);
	}, [onChange, value]);

	return (
		<div className="search-container">
			<input value={value} onChange={handleChange} type="text" name="" id="" placeholder={placeHolder} className="settings--searchbox" />
			<ClearRoundedIcon className="clear-button" onClick={() => setValue("")} />
		</div>
	);
});

export default SearchBox;
