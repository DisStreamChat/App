import React, { useState, useCallback, useEffect } from "react";
import ClearRoundedIcon from "@material-ui/icons/ClearRounded";

const SearchBox = React.memo(({ value, onChange, placeHolder, placeholder, onClick, id, onKeyDown }) => {
    const [stateValue, setStateValue] = useState(value)

    useEffect(() => {
        setStateValue(value)
    }, [value])
    
    const clickHandler = useCallback(() => {
        onChange("")
		const _ = onClick?.();
    }, [onClick, onChange]);
    
    const keyDownHandler = useCallback(e => {
        const _ = onKeyDown?.(e)
    }, [onKeyDown])

	return (
		<>
			<div className="search-container">
				<input
					value={stateValue}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={keyDownHandler}
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
