import React, { useCallback } from "react";
import firebase from "../firebase";
import { withRouter } from "react-router";
import { Redirect } from "react-router-dom";
import YouTubeIcon from "@material-ui/icons/YouTube";
import "./Auth.css";
import {v4 as uuidv4} from "uuid"

const { ipcRenderer, remote } = window.require("electron");

const Auth = props => {
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

	const loginWithTwitch = useCallback(() => {
        
        const id = uuidv4()
        const oneTimeCodeRef = firebase.db.collection("oneTimeCodes").doc(id)

        oneTimeCodeRef.onSnapshot(async snapshot => {
            const data = snapshot.data()
            if(data){
                const token = data.authToken
                await firebase.signInWithCustomToken(token)
                props.history.push("/")
            }
        })

        remote.shell.openExternal("https://id.twitch.tv/oauth2/authorize?client_id=ip3igc72c6wu7j00nqghb24duusmbr&redirect_uri=https://api.distwitchchat.com/oauth/twitch/&response_type=code&scope=openid%20moderation:read%20chat:edit%20chat:read%20channel:moderate%20channel:read:redemptions")

	}, [props.history]);

	return firebase.auth.currentUser ? (
		<Redirect to="/" />
	) : (
		<div className="Modal-Overlay">
			<div className="Modal">
				<h1 className="modal-heading">Login to DisStreamChat</h1>
				<h2 className="modal-subheading">Connect with:</h2>
				<div className="modal-buttons">
					<button onClick={loginWithTwitch} className="modal-button twitch">
						<img src={`${process.env.PUBLIC_URL}/social-media.svg`} alt="" width="20" className="logo-icon" />
						Twitch
					</button>
					<div className="modal-button youtube" onClick={signInWithGoogle}>
						<YouTubeIcon className="logo-icon yt-icon" />
						YouTube
					</div>
				</div>
			</div>
		</div>
	);
};

export default withRouter(Auth);
