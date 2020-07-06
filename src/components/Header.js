import React, { useCallback, useState, useEffect, useContext } from "react";
import { withRouter, Link } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import SettingAccordion from "./SettingsAccordion";
import firebase from "../firebase";
import Button from "@material-ui/core/Button";
import Setting from "./Setting";
import SearchBox from "./SearchBox";
import PeopleAltTwoToneIcon from "@material-ui/icons/PeopleAltTwoTone";
import "./Header.scss";

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
	const [show, setShow] = useState(true);
	const currentUser = firebase.auth.currentUser;
	const id = currentUser?.uid || " ";
	const { setMessages } = useContext(AppContext);
	const [viewingUserId, setViewingUserId] = useState();
	const [viewingUserInfo, setViewingUserInfo] = useState();
	const [viewingUserStats, setViewingUserStats] = useState();
	const { location } = props;

	useEffect(() => {
		setViewingUserId(location.pathname.split("/").slice(-1)[0]);
		setViewingUserStats(null);
	}, [location]);

	useEffect(() => {
		(async () => {
			if (chatHeader && show) {
				const userRef = firebase.db.collection("Streamers").doc(viewingUserId || " ");
				const userDoc = await userRef.get();
				const userData = userDoc.data();
				setViewingUserInfo(userData);
			}
		})();
	}, [chatHeader, show, viewingUserId]);

	useEffect(() => {
		async function getStats() {
			if (viewingUserInfo) {
				// const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=instafluff`;
				const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=${viewingUserInfo.name}`;
				const response = await fetch(ApiUrl);
				const data = await response.json();
				setViewingUserStats(prev => {
					if (data) {
						return {
							name: viewingUserInfo.displayName,
							viewers: data.viewer_count,
							isLive: true,
						};
					} else {
						return {
							name: viewingUserInfo.displayName,
							viewers: 0,
							isLive: false,
						};
					}
				});
			}
		}
		getStats();
		const id = setInterval(getStats, 10000);
		return () => clearInterval(id);
	}, [viewingUserInfo]);

	useEffect(() => {
		setChatHeader(location?.pathname?.includes("chat"));
		setShow(!location?.pathname?.includes("login"));
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
		props.history.push("/");
	}, [props.history]);

	return !show ? (
		<></>
	) : (
		<header className={`header ${settingsOpen && "open"}`}>
			<nav className="nav">
				{chatHeader && viewingUserStats && (
					<div className="stats">
						<div className={`live-status ${viewingUserStats?.isLive ? "live" : ""}`}></div>
						<div className="name">{viewingUserStats?.name}</div>
						<div className={`live-viewers`}>
							<PeopleAltTwoToneIcon />
							{viewingUserStats?.viewers}
						</div>
					</div>
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
				<SearchBox onChange={setSearch} placeHolder="Search Settings" />
				<SettingList all search={search} defaultSettings={defaultSettings} settings={appSettings} updateSettings={updateAppSetting} />
			</div>
			<div className="header-lower" onClick={() => setSettingsOpen(o => !o)}>
				<KeyboardArrowDownIcon className={`chevron ${settingsOpen && "open"}`} />
			</div>
		</header>
	);
};

export default React.memo(withRouter(Header));
