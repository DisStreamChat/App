import React, { useState, useCallback, useEffect } from "react";
import ClearRoundedIcon from "@material-ui/icons/ClearRounded";

const SearchBox = React.memo(({ onChange, placeHolder, placeholder, onClick, id }) => {
	const [value, setValue] = useState("");

	const handleChange = useCallback(e => {
		setValue(e.target.value);
	}, []);

	useEffect(() => {
		const _ = onChange?.(value);
	}, [onChange, value]);

	const clickHandler = useCallback(() => {
		setValue("");
		const _ = onClick?.();
	}, [onClick]);

	return (
		<>
			<div className="search-container">
				<input
					value={value}
					onChange={handleChange}
					type="text"
					name=""
					id={id}
					placeholder={placeHolder || placeholder}
					className="settings--searchbox"
				/>
				<ClearRoundedIcon className="clear-button" onClick={clickHandler} />
			</div>
		</>
	);
});

export default SearchBox;
