import React, { useCallback, useState } from "react";
import firebase from "../firebase";
import YouTubeIcon from "@material-ui/icons/YouTube";
import { withRouter } from "react-router";
import { Redirect, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./Auth.scss";
const { ipcRenderer } = window.require("electron");

const { remote } = window.require("electron");

const Anchor = ({ children, ...rest }) => {
	return <a {...rest}>{children}</a>;
};

const A = props => {
	const elementProps = {
		href: props.local ? "" : props.href,
		to: props.local ? props.href : "",
		className: props.className,
		target: props.newTab && "_blank",
		rel: props.newTab && "noopener noreferrer",
		disabled: props.disabled,
	};

	const Element = props.local ? Link : Anchor;

	return <Element {...elementProps}>{props.children}</Element>;
};

const Auth = React.memo(props => {
	const signInWithGoogle = useCallback(async () => {
		// create a google auth provider provided by firebase
		const provider = new firebase.app.auth.GoogleAuthProvider();
		try {
			// sign in with a google popup and get the resulting user info from google
			const result = await firebase.auth.signInWithPopup(provider);
			const user = result.user;
			const { displayName } = user;
			firebase.auth.currentUser.updateProfile({
				displayName,
			});

			props.history.push("/");
		} catch (err) {
			console.log(err.message);
		}
	}, [props.history]);
	const [readTerms, setReadTerms] = useState(false);

	const loginWithTwitch = useCallback(async () => {
		try {
			const id = uuidv4();
			const oneTimeCodeRef = firebase.db.collection("oneTimeCodes").doc(id);

			oneTimeCodeRef.onSnapshot(async snapshot => {
				const data = snapshot.data();
				if (data) {
					const token = data.authToken;
					await firebase.auth.signInWithCustomToken(token);
					props.history.push("/");
				}
			});
			await remote.shell.openExternal("https://api.disstreamchat.com/oauth/twitch/?otc=" + id);
		} catch (err) {
			async function receiveMessage(event, data) {
				console.log(data);
				const json = data;
				await firebase.auth.signInWithCustomToken(json.token);
				props.history.push("/");
			}

			// open a popup window to the twitch oauth url
			// use old pop up method
			ipcRenderer.once("log-me-in", receiveMessage);

			ipcRenderer.send("login");
		}
	}, [props.history]);

	return firebase.auth.currentUser ? (
		<Redirect to="/" />
	) : (
		<div className="Modal-Overlay">
			<div className="Modal">
				<h1 className="modal-heading">Login to DisStreamChat</h1>
				<h2 className="modal-subheading">Connect with:</h2>
				<form onSubmit={e => e.preventDefault()} className="modal-buttons">
					<button type="submit" onClick={readTerms ? loginWithTwitch : () => {}} className="modal-button twitch">
						<img src={`${process.env.PUBLIC_URL}/social-media.svg`} alt="" width="20" className="logo-icon" />
						Twitch
					</button>
					<button className="modal-button youtube" onClick={readTerms ? signInWithGoogle : () => {}}>
						<YouTubeIcon className="logo-icon yt-icon" />
						YouTube
					</button>
					<div className="legal">
						<input
							required
							value={readTerms}
							onChange={e => setReadTerms(e.target.checked)}
							id="terms-check"
							type="checkbox"
							name="terms"
						/>
						<label htmlFor="terms-check">
							I accept the{" "}
							<A href="https://disstreamchat.com/#/terms" newTab>
								terms and conditions
							</A>{" "}
							and{" "}
							<A href="https://disstreamchat.com/#/privacy" newTab>
								privacy policy
							</A>
						</label>
					</div>
				</form>
			</div>
		</div>
	);
});

export default withRouter(Auth);
