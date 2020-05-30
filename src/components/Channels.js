import React, {useState, useEffect, useContext} from 'react';
import firebase from "../firebase"
import {AppContext} from "../contexts/AppContext"
import {Link} from "react-router-dom"
import Header from "./Header"
import "./Channels.css"

const ChannelItem = props => {
    return (
        <div className="channel-item">
            <div className="channel-profile-pic">
                <img src={props["profile_image_url"] || props.profilePicture} alt="" />
            </div>
            <div className="channel-info">
                <span className="channel-name">{props.display_name || props.name}</span>
                <button disabled={!props.isMember} className="to-dashboard dashboard-button">{props.isMember ? <Link className="dashboard-link" to={`/chat/${props.uid}`} >{!props.moderator ? "Go To Dashboard" : "Go To ModView"}</Link> : <>This channel doesn't use DisTwitchChat</>}</button>
            </div>
        </div>
    )
}

const Channels = () => {

    const currentUser = firebase.auth.currentUser
    const [myChannel, setMyChannel] = useState()
    const [modChannels, setModChannels] = useState([])

    const { streamerInfo, setStreamerInfo } = useContext(AppContext)

    useEffect(() => {
        firebase.db.collection("Streamers").doc(currentUser.uid).onSnapshot(snapshot => {
            const user = snapshot.data()
            setMyChannel({ name: user?.name, isMember: true, profilePicture: user?.profilePicture, uid: currentUser.uid })
        })
    }, [currentUser])

    return (
        <div className="my-channels">
            {streamerInfo?.appSettings?.showHeader && <Header pad="pdbt-1"/>}

            <h1>Your Channel</h1>
            <ChannelItem {...myChannel} />
            <hr />
            <h1>Channels you moderate</h1>
            {modChannels.map(channel => (
                <ChannelItem {...channel} moderator />
            ))}
        </div>
    );
}

export default Channels;
