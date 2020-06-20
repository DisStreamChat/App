import React, { useCallback} from 'react';
import firebase from "../firebase"
import "./Auth.css"
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';
import YouTubeIcon from '@material-ui/icons/YouTube';
const { ipcRenderer } = window.require('electron');

const Auth = props => {
    const signInWithGoogle = useCallback(async () => {
        // create a google auth provider provided by firebase
        const provider = new firebase.app.auth.GoogleAuthProvider()
        try {
            // sign in with a google popup and get the resulting user info from google
            const result = await firebase.auth.signInWithPopup(provider)
            const user = result.user
            const { displayName } = user
            firebase.auth.currentUser.updateProfile({
                displayName
            })

            props.history.push("/")
        } catch (err) {
            console.log(err.message)
        }
    }, [props.history])

    const loginWithTwitch = useCallback(() => {
        // function that is executed when a message is received
        async function receiveMessage(event, data) {
            const json = data
            const result = await firebase.auth.signInWithCustomToken(json.token)
            const { displayName } = json
            firebase.auth.currentUser.updateProfile({
                displayName
            })

            
            props.history.push("/")

        }

        // listen for a message from the popup window that will send the sign in info
        ipcRenderer.once('log-me-in', receiveMessage);

        // open a popup window to the twitch oauth url
        ipcRenderer.send('login');
    }, [props.history])

    return firebase.auth.currentUser ? <Redirect to="/" /> : (
        <div className="Modal-Overlay">
            <div className="Modal">
                <h1 className="modal-heading">Login to DisTwitchChat</h1>
                <h2 className="modal-subheading">Connect with:</h2>
                <div className="modal-buttons">
                    <button onClick={loginWithTwitch} className="modal-button twitch"><img src={`${process.env.PUBLIC_URL}/social-media.svg`} alt="" width="20" className="logo-icon" />Twitch</button>
                    <div className="modal-button youtube" onClick={signInWithGoogle}><YouTubeIcon className="logo-icon yt-icon" />YouTube</div>
                </div>
            </div>
        </div>
    );
}

export default withRouter(Auth); 
