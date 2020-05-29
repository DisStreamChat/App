import React, { useCallback, useState, useContext} from 'react';
import firebase from "../firebase"
import "./Auth.css"
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';
import YouTubeIcon from '@material-ui/icons/YouTube';


const Auth = props => {
    const signInWithGoogle = useCallback(async () => {
        const provider = new firebase.app.auth.GoogleAuthProvider()
        try {
            const result = await firebase.auth.signInWithPopup(provider)
            const user = result.user
            const { displayName, photoURL: profilePicture } = user
            firebase.auth.currentUser.updateProfile({
                displayName: user.displayName
            })
            try {
                await firebase.db.collection("Streamers").doc(user.uid).update({
                    displayName,
                    profilePicture,
                })
            } catch (err) {
                await firebase.db.collection("Streamers").doc(user.uid).set({
                    displayName,
                    uid: user.uid,
                    profilePicture,
                    ModChannels: [],
                    TwitchName: displayName.toLowerCase(),
                    appSettings: {
                        TwitchColor: "",
                        YoutubeColor: "",
                        discordColor: "",
                        displayPlatformColors: false,
                        displayPlatformIcons: false,
                        highlightedMessageColor: "",
                        showHeader: true,
                        showSourceButton: false
                    },
                    discordLinked: false,
                    guildId: "",
                    liveChatId: "",
                    overlaySettings: {
                        TwitchColor: "",
                        YoutubeColor: "",
                        discordColor: "",
                        displayPlatformColors: false,
                        displayPlatformIcons: false,
                        highlightedMessageColor: "",
                    },
                    twitchAuthenticated: true,
                    youtubeAuthenticated: false
                })
            }

        } catch (err) {
            console.log(err.message)
        }
    }, [])

    const loginWithTwitch = () => {
        window.open(`https://id.twitch.tv/oauth2/authorize?client_id=ip3igc72c6wu7j00nqghb24duusmbr&redirect_uri=http://localhost:3000&response_type=code&scope=openid%20moderation:read`)
    }

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
