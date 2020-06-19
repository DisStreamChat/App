import React, { useCallback, useState, useEffect } from 'react';
import "./Header.css"
import firebase from "../firebase"
import { withRouter, Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Setting from "./Setting"
import SettingAccordion from "./SettingsAccordion"

import { defaults, colorStyles, guildOption, types } from "./userUtils";

const typesIndices = ["boolean", "color", "number"]

const SettingList = props => {
	return (
		<SettingAccordion>
			{Object.entries(props.defaultSettings || {})
				.sort()
				.sort((a, b) => {
					return Math.sign(typesIndices.indexOf(a[1].type) - typesIndices.indexOf(b[1].type));
				})
				.map(([key, value]) => {
					return (
						<Setting
							default={defaults[key]}
							key={key}
							onChange={props.updateSettings}
							value={props?.settings?.[key]}
							name={key}
                            type={value.type}
                            min={value.min}
                            max={value.max}
                            step={value.step}
						/>
                    );
                    
				})}
		</SettingAccordion>
	);
};

const Header = props => {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [appSettings, setAppSettings] = useState()
	const [defaultSettings, setDefaultSettings] = useState();
    const currentUser = firebase.auth.currentUser
    const id = currentUser.uid

	useEffect(() => {
		(async () => {
			const settingsRef = await firebase.db
				.collection("defaults")
				.doc("settings")
				.get();
			const settingsData = settingsRef.data().settings;
			setDefaultSettings(settingsData);
		})();
	}, []);


	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(id).onSnapshot(snapshot => {
                const data = snapshot.data()
                if(data){
                    setAppSettings(data.appSettings);
                }
            })
        return unsub
	}, [id]);

    const clearChat = useCallback(() => {
        props.setMessages(m => m.map(msg => {return {...msg, deleted: true}}))
    }, [props])

    const clearTwitch = useCallback(() => {
        props.setMessages(messages => messages.map(msg => {return {...msg, deleted: msg.deleted || msg.platform === "twitch"}}))
    }, [props])
    
    const clearDiscord = useCallback(() => {
        props.setMessages(messages => messages.map(msg => { return { ...msg, deleted: msg.deleted || msg.platform === "discord"}}))
    }, [props])

	const updateAppSetting = useCallback(
		async (name, value) => {
			const copy = { ...appSettings };
			copy[name] = value;
			setAppSettings(copy);
			const userRef = firebase.db.collection("Streamers").doc(id);
			await userRef.update({
				appSettings: copy,
			});
		},
		[appSettings, id]
	);

    const signout = useCallback(async () => {
        await firebase.logout()
        localStorage.removeItem("userId")
        props.history.push("/")
    }, [props.history]) 

    return (
        <header className={`header ${props.pad} ${settingsOpen && "open"}`} >
            <nav className="nav">
                {props.setMessages && 
                <>
                    <Button variant="contained" onClick={clearChat}>Clear Chat</Button>
                    <Button variant="contained" onClick={clearTwitch}>Clear Twitch Chat</Button>
                    <Button variant="contained" onClick={clearDiscord}>Clear Discord Chat</Button>
                </>
                }
                {props.backButton ? 
                    <Link to="/channels"><Button variant="contained" color="primary">Channels</Button></Link>
                    : 
                    <Button variant="contained" color="primary" onClick={signout}>Sign Out</Button>
                }
            </nav>
            <div className="header-settings">
                <SettingList 
                    all
                    defaultSettings={defaultSettings}
                    settings={appSettings}
                    updateSettings={updateAppSetting}
                />
            </div>
            <div className="header-lower" onClick={() => setSettingsOpen(o => !o)}>
                <KeyboardArrowDownIcon className={`chevron ${settingsOpen && "open"}`}/>
            </div>
        </header>
    );
} 

export default withRouter(Header); 
