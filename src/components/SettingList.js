import React from "react";
import SettingAccordion from "./SettingsAccordion";
import Setting from "./Setting";

const SettingList = React.memo(props => {
	return (
		<SettingAccordion>
			{Object.entries(props.defaultSettings || {})
				.filter(
					([name, data]) =>
						!data.discordSetting &&
						(!props.search
							? true
							: name
									?.match(/[A-Z][a-z]+|[0-9]+/g)
									?.join(" ")
									?.toLowerCase()
									?.includes(props?.search?.toLowerCase()))
				)
				.sort((a, b) => {
					const categoryOrder = a[1].type.localeCompare(b[1].type);
					const nameOrder = a[0].localeCompare(b[0]);
					return !!categoryOrder ? categoryOrder : nameOrder;
				})
				.map(([key, value]) => {
					return (
						<Setting
							default={value.value}
							key={key}
							onChange={props.updateSettings}
							value={props?.settings?.[key]}
							name={key}
							type={value.type}
							min={value.min}
							max={value.max}
							step={value.step}
							options={value.options}
							description={value.description}
						/>
					);
				})}
		</SettingAccordion>
	);
});

export default SettingList