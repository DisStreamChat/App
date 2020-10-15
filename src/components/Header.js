import React, { useCallback, useState, useEffect, useContext, useMemo } from "react";
import { withRouter, Link } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import SettingsTwoToneIcon from "@material-ui/icons/SettingsTwoTone";
import Skeleton from "@material-ui/lab/Skeleton";
import firebase from "../firebase";
import Button from "@material-ui/core/Button";
import SearchBox from "./SearchBox";
import PeopleAltTwoToneIcon from "@material-ui/icons/PeopleAltTwoTone";
import GetAppIcon from "@material-ui/icons/GetApp";
import "./Header.scss";
import compare from "semver-compare";
import ClearIcon from "@material-ui/icons/Clear";
import MailTwoToneIcon from "@material-ui/icons/MailTwoTone";
import { Tooltip, ClickAwayListener } from "@material-ui/core";
import { useInterval } from "react-use";
import { CSSTransition } from "react-transition-group";
import HomeIcon from "@material-ui/icons/Home";
import FavoriteTwoToneIcon from "@material-ui/icons/FavoriteTwoTone";
import FavoriteIcon from "@material-ui/icons/Favorite";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { useAsyncMemo } from "use-async-memo";
import SettingList from "./SettingList";
import { maxDisplayNum } from "../utils/constants";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
// import BuildIcon from "@material-ui/icons/Build";
const { remote, ipcRenderer } = window.require("electron");
const customTitlebar = window.require("custom-electron-titlebar");

let MyTitleBar = new customTitlebar.Titlebar({
	backgroundColor: customTitlebar.Color.fromHex("#17181ba1"),
	menu: null,
	maximizable: false,
});
MyTitleBar.updateTitle("DisStreamChat");
MyTitleBar.setHorizontalAlignment("left");

const Header = props => {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [appSettings, setAppSettings] = useState();
	const [defaultSettings, setDefaultSettings] = useState();
	const [search, setSearch] = useState();
	const [chatHeader, setChatHeader] = useState(false);
	const [show, setShow] = useState(true);
	const currentUser = firebase.auth.currentUser;
	const id = currentUser?.uid || " ";
	const { location } = props;
	const {
		setShowViewers,
		windowFocused,
		streamerInfo,
		userData,
		setPinnedMessages,
		unreadMessageIds,
		setUnreadMessageIds,
		setMessages,
		NotifyChanels,
		modChannels,
		setModChannels,
		pinnedChannels,
		setPinnedChannels,
		isMod,
	} = useContext(AppContext);
	const [viewingUserId, setViewingUserId] = useState();
	const [viewingUserInfo, setViewingUserInfo] = useState();
	const [viewingUserStats, setViewingUserStats] = useState();
	const [updateLink, setUpdateLink] = useState();
	const [isPopoutOut, setIsPopOut] = useState();
	const [unreadMessages, setUnreadMessages] = useState(false);
	const absoluteLocation = window.location;
	const [platform, setPlatform] = useState("");
	const [follows, setFollows] = useState([]);
	const [moreMenuOpen, setMoreMenuOpen] = useState();
	const [notifyLive, setNotifyLive] = useState(false);
	const [modActions, setModActions] = useState();
	const viewingName = viewingUserStats?.name;
	const following = useMemo(() => follows.includes(viewingName?.toLowerCase?.()), [follows, viewingName]);

	useEffect(() => {
		(async () => {
			if (userData.TwitchName) {
				try {
					const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}/twitch/follows?user=${userData.TwitchName}&key=name`);
					const json = await response.json();
					setFollows(prev => (json.follows ? json.follows : json));
				} catch (err) {}
			}
		})();
	}, [userData]);

	useEffect(() => {
		setNotifyLive(NotifyChanels.includes(viewingUserId));
	}, [viewingUserId, NotifyChanels]);

	useEffect(() => {
		setModActions(streamerInfo?.ShowModOptions);
	}, [streamerInfo]);

	const toggleModActions = useCallback(async () => {
		setModActions(prev => {
			firebase.db.collection("Streamers").doc(currentUser.uid).update({
				"appSettings.ShowModOptions": !prev,
			});
			return !prev;
		});
	}, [currentUser]);

	const uid = currentUser?.uid;
	const toggleLiveNotify = useCallback(async () => {
		setNotifyLive(prev => {
			const action = prev ? firebase.firestore.FieldValue.arrayRemove : firebase.firestore.FieldValue.arrayUnion;
			firebase.db
				.collection("live-notify")
				.doc(uid)
				.update({
					channels: action(viewingUserId),
				});
			return !prev;
		});
	}, [uid, viewingUserId]);

	useEffect(() => {
		setUnreadMessages(!!unreadMessageIds.length);
	}, [setUnreadMessages, unreadMessageIds]);

	useEffect(() => {
		ipcRenderer.on("send-platform", (event, data) => setPlatform(data));
		return () => ipcRenderer.removeAllListeners("send-platform");
	}, []);

	useEffect(() => {
		(async () => {
			const currentVersion = remote.app.getVersion();
			MyTitleBar.updateTitle(`DisStreamChat ${currentVersion}`);
			const response = await fetch("https://api.github.com/repos/disstreamchat/App/releases");
			const json = await response.json();
			const latestVersionInfo = json[0];
			const latestVersion = latestVersionInfo?.tag_name;
			const updateable = compare(latestVersion || "", currentVersion || "") > 0;
			if (updateable) {
				let downLoadUrl;
				if (platform === "win32") {
					const windowsDownloadAsset = latestVersionInfo.assets[0];
					downLoadUrl = windowsDownloadAsset.browser_download_url;
				} else if (platform === "linux") {
					downLoadUrl = "https://i.lungers.com/disstreamchat/linux";
				} else if (platform === "darwin") {
					downLoadUrl = "https://i.lungers.com/disstreamchat/darwin";
				}
				setUpdateLink(downLoadUrl);
			}
		})();
	}, [platform]);

	useEffect(() => {
		setViewingUserId(location.pathname.split("/").slice(-1)[0]);
		setViewingUserStats();
	}, [location]);

	useEffect(() => {
		(async () => {
			if (chatHeader && show) {
				try {
					const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/resolveuser?user=${viewingUserId}&platform=twitch&place=header`;
					const response = await fetch(apiUrl);
					const userData = await response.json();
					setViewingUserInfo(userData);
				} catch (err) {
					console.log(err.message);
				}
			}
		})();
	}, [chatHeader, show, viewingUserId]);

	const getStats = useCallback(async () => {
		if (viewingUserInfo) {
			const ApiUrl = `${process.env.REACT_APP_SOCKET_URL}/stats/twitch/?name=${viewingUserInfo?.display_name?.toLowerCase?.()}&new=true`;
			const response = await fetch(ApiUrl);
			const data = await response.json();
			setViewingUserStats(prev => {
				if (data) {
					return {
						name: viewingUserInfo.display_name,
						viewers: data.viewer_count,
						isLive: data.isLive,
					};
				} else {
					return {
						name: viewingUserInfo.display_name,
						viewers: 0,
						isLive: false,
					};
				}
			});
		}
	}, [viewingUserInfo]);

	useEffect(() => {
		if (viewingUserInfo) {
			getStats();
		}
	}, [getStats, viewingUserInfo]);

	useInterval(getStats, 60000);

	useEffect(() => {
		setChatHeader(location?.pathname?.includes("chat"));
		setShow(!location?.pathname?.includes("login"));
		setIsPopOut(new URLSearchParams(location?.search).has("popout"));
	}, [location, absoluteLocation]);

	useEffect(() => {
		(async () => {
			const settingsRef = await firebase.db.collection("defaults").doc("settings16").get();
			const settingsData = settingsRef.data().settings;
			setDefaultSettings(settingsData);
		})();
	}, []);

	useEffect(() => {
		const data = userData;
		if (data) {
			setAppSettings(data.appSettings);
		}
	}, [userData]);

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

	const handleFollow = useCallback(async () => {
		const otc = (await firebase.db.collection("Secret").doc(currentUser.uid).get()).data().value;
		const apiUrl = `${process.env.REACT_APP_SOCKET_URL}/twitch/follow?user=${userData.TwitchName}&channel=${viewingName}&otc=${otc}&id=${currentUser.uid}`;
		const method = following ? "DELETE" : "PUT";
		if (following) {
			setFollows(prev => prev.filter(name => name?.toLowerCase?.() !== viewingName?.toLowerCase?.()));
		} else {
			setFollows(prev => [...prev, viewingName?.toLowerCase?.()]);
		}
		await fetch(apiUrl, { method });
	}, [userData, following, viewingName, currentUser]);

	const popoutChannel = useCallback(async () => {
		ipcRenderer.send("popout-stream", viewingName);
	}, [viewingName]);

	useEffect(() => {
		if (!chatHeader || !windowFocused) {
			setMoreMenuOpen(false);
		}
	}, [chatHeader, windowFocused]);

	return !show ? (
		<></>
	) : (
		<CSSTransition in={streamerInfo?.HideHeaderOnUnfocus ? windowFocused : true} timeout={100} unmountOnExit classNames="header-node">
			<header className={`header ${settingsOpen && "open"}`}>
				<nav className="nav">
					{chatHeader && (
						<>
							<div className="stats">
								<div className={`live-status ${viewingUserStats?.isLive ? "live" : ""}`}></div>
								{!viewingUserStats ? (
									<Skeleton variant="text" animation="wave" />
								) : (
									<a href={`https://twitch.tv/${viewingUserStats?.name?.toLowerCase?.()}`} className="name">
										{viewingName}
									</a>
								)}
							</div>
						</>
					)}
					<div className={`all-icons ${!chatHeader ? "channel-icons" : ""}`}>
						{chatHeader && (
							<div className="icons icons-left">
								<Tooltip arrow title={`${following ? "Unfollow" : "Follow"}`}>
									<div onClick={handleFollow}>{following ? <FavoriteIcon /> : <FavoriteTwoToneIcon />}</div>
								</Tooltip>
								{/* <Tooltip arrow title="Channel details">
									<div>
										<VisibilityIcon />
									</div>
								</Tooltip> */}
								<Tooltip arrow title={`${unreadMessages ? "Mark as Read" : "No unread Messages"}`}>
									<div
										onClick={() => setUnreadMessageIds([])}
										className={`messages-notification ${unreadMessages ? "unread" : ""}`}
									>
										{unreadMessages
											? unreadMessageIds.length > maxDisplayNum
												? `${maxDisplayNum}+`
												: unreadMessageIds.length
											: ""}
										{unreadMessages ? " " : ""}
										<MailTwoToneIcon />
									</div>
								</Tooltip>
								<Tooltip arrow title="Viewers in Chat">
									<div className={"live-viewers"} onClick={() => setShowViewers(true)}>
										<PeopleAltTwoToneIcon />
										{viewingUserStats?.viewers}
									</div>
								</Tooltip>
							</div>
						)}

						<div className={`icons ${chatHeader ? "bl-light" : ""}`}>
							{chatHeader ? (
								<>
									<ContextMenuTrigger id="channels">
										<Tooltip arrow title="Channels">
											{isPopoutOut ? (
												<div className="cp">
													<HomeIcon />
												</div>
											) : (
												<Link className="cp" to="/channels">
													<HomeIcon />
												</Link>
											)}
										</Tooltip>
									</ContextMenuTrigger>
									<ContextMenu id="channels">
										{[{ login: userData.TwitchName, id: userData.twitchId }, ...modChannels].map(channel => (
											<MenuItem key={channel.id}>
												<Link to={`/chat/${channel.id}`}>{channel.login}</Link>
											</MenuItem>
										))}
									</ContextMenu>
								</>
							) : (
								<Button variant="contained" color="primary" onClick={signout}>
									Sign Out
								</Button>
							)}
							<Tooltip arrow title={`${settingsOpen ? "Close" : ""} Settings`}>
								<button className="clear" onClick={() => setSettingsOpen(o => !o)}>
									{!settingsOpen ? <SettingsTwoToneIcon /> : <ClearIcon />}
								</button>
							</Tooltip>

							{chatHeader && (
								<ClickAwayListener onClickAway={() => setMoreMenuOpen(false)}>
									<div className="more">
										<Tooltip arrow title="More">
											<button onClick={() => setMoreMenuOpen(prev => !prev)}>
												<MoreVertIcon />
											</button>
										</Tooltip>
										<CSSTransition in={moreMenuOpen} unmountOnExit>
											<div className="menu">
												<a href={`https://www.twitch.tv/${viewingName}`} className="menu-item">
													Open In Browser
												</a>
												<div onClick={popoutChannel} className="menu-item">
													Open In Popout
												</div>
												{isMod && (
													<a className="menu-item" href={`https://www.twitch.tv/moderator/${viewingName}`}>
														Open ModView
													</a>
												)}
												<div className="menu-item">
													<input
														checked={notifyLive}
														onChange={toggleLiveNotify}
														type="checkbox"
														id={`notify-${viewingName}`}
													/>
													<label htmlFor={`notify-${viewingName}`}>Notify When Live</label>
												</div>
												{isMod && (
													<div className="menu-item">
														<input
															checked={modActions}
															onChange={toggleModActions}
															type="checkbox"
															id={`mod-${viewingName}`}
														/>
														<label htmlFor={`mod-${viewingName}`}>Show Mod Actions</label>
													</div>
												)}
												<div
													onClick={() => {
														setMessages([]);
														setPinnedMessages([]);
													}}
													className="menu-item border-top-1"
												>
													Clear local chat
												</div>
											</div>
										</CSSTransition>
									</div>
								</ClickAwayListener>
							)}

							{updateLink && (
								<Tooltip arrow title="update available">
									<button
										id="update-link"
										onClick={() => {
											ipcRenderer.send("update");
										}}
									>
										<GetAppIcon></GetAppIcon>
										<div id="notification-light"></div>
									</button>
								</Tooltip>
							)}
						</div>
					</div>
				</nav>
				<div className="header-settings">
					<SearchBox value={search} onChange={setSearch} placeHolder="Search Settings" />
					<SettingList all search={search} defaultSettings={defaultSettings} settings={appSettings} updateSettings={updateAppSetting} />
				</div>
			</header>
		</CSSTransition>
	);
};

export default withRouter(React.memo(Header));
