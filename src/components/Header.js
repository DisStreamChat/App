import React, { useCallback, useState, useEffect, useContext } from "react";
import { withRouter, Link } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import ClearRoundedIcon from "@material-ui/icons/ClearRounded";
import SettingAccordion from "./SettingsAccordion";
import firebase from "../firebase";
import Button from "@material-ui/core/Button";
import Setting from "./Setting";
import "./Header.css";
import SearchBox from "./SearchBox";

const SettingList = props => {
	return (
		<SettingAccordion>
			{Object.entries(props.defaultSettings || {})
				.filter(([name]) => (!props.search ? true : name?.toLowerCase()?.includes(props?.search?.toLowerCase())))
				.sort()
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
						/>
					);
				})}
		</SettingAccordion>
	);
};

const Header = props => {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [appSettings, setAppSettings] = useState();
	const [defaultSettings, setDefaultSettings] = useState();
	const [search, setSearch] = useState();
    const [chatHeader, setChatHeader] = useState(false);
    const [show, setShow] = useState(true)
	const currentUser = firebase.auth.currentUser;
    const id = currentUser?.uid || " ";
    const {setMessages} = useContext(AppContext)
    
    
    const {location} = props
	useEffect(() => {
		setChatHeader(location?.pathname?.includes("chat"));
        setShow(!location.pathname.includes("login"))
    }, [location]);

	useEffect(() => {
		(async () => {
			const settingsRef = await firebase.db.collection("defaults").doc("settings").get();
			const settingsData = settingsRef.data().settings;
			setDefaultSettings(settingsData);
		})();
	}, []);

	useEffect(() => {
		const unsub = firebase.db
			.collection("Streamers")
			.doc(id)
			.onSnapshot(snapshot => {
				const data = snapshot.data();
				if (data) {
					setAppSettings(data.appSettings);
				}
			});
		return unsub;
	}, [id]);

	const clearChat = useCallback(() => {
		setMessages(m =>
			m.map(msg => {
				return { ...msg, deleted: true };
			})
		);
		setTimeout(() => {
			setMessages([]);
		}, 10000);
	}, [setMessages]);

	const clearTwitch = useCallback(() => {
		setMessages(messages =>
			messages.map(msg => {
				return { ...msg, deleted: msg.deleted || msg.platform === "twitch" };
			})
		);
		setTimeout(() => {
			setMessages(prev => prev.filter(msg => !msg.deleted));
		}, 10000);
	}, [setMessages]);

	const clearDiscord = useCallback(() => {
		setMessages(messages =>
			messages.map(msg => {
				return { ...msg, deleted: msg.deleted || msg.platform === "discord" };
			})
		);
		setTimeout(() => {
			setMessages(prev => prev.filter(msg => !msg.deleted));
		}, 10000);
	}, [setMessages]);

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
		await firebase.logout();
		localStorage.removeItem("userId");
		props.history.push("/");
	}, [props.history]);

	return !show ? <></> :(
		<header className={`header ${props.pad} ${settingsOpen && "open"}`}>
			<nav className="nav">
				{chatHeader && (
					<>
						<Button variant="contained" onClick={clearChat}>
							Clear Chat
						</Button>
						<Button variant="contained" onClick={clearTwitch}>
							Clear Twitch Chat
						</Button>
						<Button variant="contained" onClick={clearDiscord}>
							Clear Discord Chat
						</Button>
					</>
				)}
				{chatHeader ? (
					<Link to="/channels">
						<Button variant="contained" color="primary">
							Channels
						</Button>
					</Link>
				) : (
					<Button variant="contained" color="primary" onClick={signout}>
						Sign Out
					</Button>
				)}
			</nav>
			<div className="header-settings">
				<SearchBox onChange={setSearch} placeHolder="Search Settings"/>
				<SettingList all search={search} defaultSettings={defaultSettings} settings={appSettings} updateSettings={updateAppSetting} />
			</div>
			<div className="header-lower" onClick={() => setSettingsOpen(o => !o)}>
				<KeyboardArrowDownIcon className={`chevron ${settingsOpen && "open"}`} />
			</div>
		</header>
	);
};

export default React.memo(withRouter(Header));
