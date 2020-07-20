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
import GetAppIcon from "@material-ui/icons/GetApp";
import "./Header.scss";
import compare from "semver-compare";
import ClearIcon from "@material-ui/icons/Clear";
import MailTwoToneIcon from "@material-ui/icons/MailTwoTone";
import { Tooltip } from "@material-ui/core";
const {remote} = window.require("electron");
const customTitlebar = window.require("custom-electron-titlebar");

let MyTitleBar = new customTitlebar.Titlebar({
	backgroundColor: customTitlebar.Color.fromHex("#17181ba1"),
	// shadow: false,
	// color: "black",
	menu: null,
});
MyTitleBar.updateTitle("DisStreamChat");
MyTitleBar.setHorizontalAlignment("left");

const SettingList = props => {
	return (
		<SettingAccordion>
			{Object.entries(props.defaultSettings || {})
				.filter(([name, data]) => (!data.discordSetting && (!props.search ? true : name?.toLowerCase()?.includes(props?.search?.toLowerCase()))))
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
						/>
					);
				})}
		</SettingAccordion>
	);
};

const maxDisplayNum = 999;

const Header = props => {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [appSettings, setAppSettings] = useState();
	const [defaultSettings, setDefaultSettings] = useState();
	const [search, setSearch] = useState();
	const [chatHeader, setChatHeader] = useState(false);
	const [show, setShow] = useState(true);
	const currentUser = firebase.auth.currentUser;
	const id = currentUser?.uid || " ";
	const { messages, setMessages } = useContext(AppContext);
	const [viewingUserId, setViewingUserId] = useState();
	const [viewingUserInfo, setViewingUserInfo] = useState();
	const [viewingUserStats, setViewingUserStats] = useState();
    const [updateLink, setUpdateLink] = useState();
    const [isPopoutOut, setIsPopOut] = useState()
    const { location } = props;
    const absoluteLocation = window.location
	const [unreadMessages, setUnreadMessages] = useState(false);

	useEffect(() => {
		(async () => {
			const currentVersion = remote.app.getVersion();
			MyTitleBar.updateTitle(`DisStreamChat ${currentVersion}`);
			const response = await fetch("https://api.github.com/repos/disstreamchat/App/releases");
			const json = await response.json();
			const latestVersionInfo = json[0];
			const latestVersion = latestVersionInfo.tag_name;
			const updateable = compare(latestVersion, currentVersion) > 0;
			if (updateable) {
				// add cross platform url
				const windowsDownloadAsset = latestVersionInfo.assets[0];
				const windowsDownloadUrl = windowsDownloadAsset.browser_download_url;
				setUpdateLink(windowsDownloadUrl);
			}
		})();
	}, []);

	useEffect(() => {
		setTimeout(() => {
			const filteredMessages = messages.filter(msg => !msg.read && !msg.deleted);
			setUnreadMessages(filteredMessages.length ? filteredMessages : false);
		}, 500);
	}, [messages]);

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
				const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=${viewingUserInfo.name}&new=true`;
				const response = await fetch(ApiUrl);
				const data = await response.json();
				setViewingUserStats(prev => {
					if (data) {
						return {
							name: viewingUserInfo.displayName,
							viewers: data.viewer_count,
							isLive: data.isLive,
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
		const id = setInterval(getStats, 45000);
		return () => clearInterval(id);
	}, [viewingUserInfo]);

	useEffect(() => {
		setChatHeader(location?.pathname?.includes("chat"));
        setShow(!location?.pathname?.includes("login"));
        setIsPopOut(new URLSearchParams(location?.search).has("popout"))
	}, [location, absoluteLocation]);

	useEffect(() => {
		(async () => {
			const settingsRef = await firebase.db.collection("defaults").doc("settings").get();
            const settingsData = settingsRef.data().settings
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
		<>
			<header className={`header ${settingsOpen && "open"}`}>
				<nav className="nav">
					{chatHeader && viewingUserStats && (
						<div className="stats">
							<div className={`live-status ${viewingUserStats?.isLive ? "live" : ""}`}></div>
							<div className="name">{viewingUserStats?.name}</div>
							<div className={"live-viewers"}>
								<PeopleAltTwoToneIcon />
								{viewingUserStats?.viewers}
							</div>
						</div>
					)}
					{chatHeader ? (
						<>
							<Tooltip title={`${unreadMessages ? "Mark as Read" : ""}`} arrow>
								<div
									onClick={() => setMessages(prev => prev.map(msg => ({ ...msg, read: true })))}
									className={`messages-notification ${unreadMessages ? "unread" : ""}`}
								>
									{unreadMessages ? (unreadMessages.length > maxDisplayNum ? `${maxDisplayNum}+` : unreadMessages.length) : ""}
									{unreadMessages ? " " : ""}
									<MailTwoToneIcon />
								</div>
							</Tooltip>
							{!isPopoutOut && <Link to="/channels">
								<Button variant="contained" color="primary">
									{isPopoutOut ? "Close" : "Channels"}
								</Button>
							</Link>}
						</>
					) : (
						<Button variant="contained" color="primary" onClick={signout}>
							Sign Out
						</Button>
					)}
					{updateLink && (
						<a href={updateLink}>
							<GetAppIcon></GetAppIcon>
						</a>
					)}
				</nav>
				<div className="header-settings">
					<SearchBox onChange={setSearch} placeHolder="Search Settings" />
					<SettingList all search={search} defaultSettings={defaultSettings} settings={appSettings} updateSettings={updateAppSetting} />
				</div>
				<div className="header-lower">
					<KeyboardArrowDownIcon onClick={() => setSettingsOpen(o => !o)} className={`chevron ${settingsOpen && "open"}`} />
				</div>
				<ClearIcon onClick={() => setSettingsOpen(o => !o)} className={`closeButton ${settingsOpen && "open"}`} />
			</header>
		</>
	);
};

export default React.memo(withRouter(Header));
