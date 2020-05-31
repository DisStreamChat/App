import React, { useCallback} from 'react';
import firebase from "../firebase"
import "./Auth.css"
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';
import YouTubeIcon from '@material-ui/icons/YouTube';


const Auth = props => {
    const signInWithGoogle = useCallback(async () => {
        // create a google auth provider provided by firebase
        const provider = new firebase.app.auth.GoogleAuthProvider()
        try {
            // sign in with a google popup and get the resulting user info from google
            const result = await firebase.auth.signInWithPopup(provider)
            const user = result.user
            const { displayName, photoURL: profilePicture } = user
            firebase.auth.currentUser.updateProfile({
                displayName: user.displayName
            })
            // update or set the users database entry. the try catch is used to detect if there is not already a user in the database
            // it will throw an error trying to update a document that doesn't exist
            try {
                await firebase.db.collection("Streamers").doc(user.uid).update({
                    displayName,
                    profilePicture,
                    TwitchName: displayName.toLowerCase(),
                    name: displayName.toLowerCase()
                })
            } catch (err) {
                await firebase.db.collection("Streamers").doc(user.uid).set({
                    displayName,
                    uid: user.uid,
                    profilePicture,
                    ModChannels: [],
                    TwitchName: displayName.toLowerCase(),
                    name: displayName.toLowerCase(),
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
            props.history.push("/")
        } catch (err) {
            console.log(err.message)
        }
    }, [props.history])

    const loginWithTwitch = useCallback(() => {
        // function that is executed when a message is received
        async function receiveMessage(event) {
            // only accept messages from a valid origin
            if (event.origin !== "https://distwitchchat-backend.herokuapp.com" && event.origin !== "http://localhost:3200") {
                console.log('invalid origin', event.origin);
            } else {
                // the message data is stored in 'event.data', use that data to sign the user in and update or set their database entry
                const json = event.data
                const result = await firebase.auth.signInWithCustomToken(json.token)
                const uid = result.user.uid
                const { displayName, profilePicture, ModChannels } = json
                firebase.auth.currentUser.updateProfile({
                    displayName
                })
                // update or set the users database entry. the try catch is used to detect if there is not already a user in the database
                // it will throw an error trying to update a document that doesn't exist
                try {
                    await firebase.db.collection("Streamers").doc(uid).update({
                        displayName,
                        profilePicture,
                        ModChannels,
                        name: displayName.toLowerCase(),
                        TwitchName: displayName.toLowerCase()
                    })
                } catch (err) {
                    await firebase.db.collection("Streamers").doc(uid).set({
                        displayName,
                        uid,
                        profilePicture,
                        ModChannels,
                        TwitchName: displayName.toLowerCase(),
                        name: displayName.toLowerCase(),
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
                props.history.push("/")
            }
        }

        // listen for a message from the popup window that will send the sign in info
        window.addEventListener('message', receiveMessage, {
            once: true,
        });

        // open a popup window to the twitch oauth url
        window.open(`https://id.twitch.tv/oauth2/authorize?client_id=ip3igc72c6wu7j00nqghb24duusmbr&redirect_uri=https://distwitchchat-backend.herokuapp.com/oauth/twitch/&response_type=code&scope=openid%20moderation:read`)
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
