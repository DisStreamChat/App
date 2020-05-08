import React, { useState, useCallback, useContext, useEffect } from "react";
import DOMPurify from "dompurify";
import marked from "marked"
import Avatar from "@material-ui/core/Avatar";
import HighlightOffTwoToneIcon from '@material-ui/icons/HighlightOffTwoTone';
import SettingsEthernetIcon from '@material-ui/icons/SettingsEthernet';
import { CSSTransition } from "react-transition-group"
import CodeIcon from '@material-ui/icons/Code';
import "./Message.css"
import { AppContext } from "../contexts/AppContext";

let renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
    let link = marked.Renderer.prototype.link.apply(this, arguments);
    return link.replace("<a", "<a target='_blank'");
};

marked.setOptions({
    renderer: renderer
});

const broadcasterImage = "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1"
const ModeratorBadge = "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1"
const VipBadge = "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1"
const defaultSubBadge = "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1"
const discordLogo = "https://i.imgur.com/ZOKp8LH.png"
const twitchLogo = "https://cdn.vox-cdn.com/thumbor/hSP3rKWFHC7hbbtpCp_DIKiRSDI=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/2937002/twitch.0.jpg"
 
const Message = props => {
    const [active, setActive] = useState(true)
    const [showSource, setShowSource] = useState(false)
    const [subBadge, setSubBadge] = useState("")
    const [displayPlatform, setDisplayPlatform] = useState(false)

    const {streamerInfo} = useContext(AppContext)

    useEffect(() => {
        setDisplayPlatform(streamerInfo.displayPlatform)
    }, [streamerInfo])

    useEffect(() => {
        if(props.msg.badges.subscriber != undefined){
            const subLevel = Math.max(+props.msg.badges.subscriber, 1)
            let badgeLevel = 0
            if(Object.keys(streamerInfo.subBadges || {}).length > 0){
                const badges = streamerInfo.subBadges
                for (const key of Object.keys(badges).map(Number).sort((a, b) => a-b)) {
                    if(key <= subLevel){
                        badgeLevel = key
                    }
                }
                if(badgeLevel === 0) setSubBadge(defaultSubBadge)
                else setSubBadge(badges[badgeLevel])
            }else{
                setSubBadge(defaultSubBadge)
            }
        }
    }, [props.msg, streamerInfo])

    const deleteMe = useCallback(() => {
        props.delete(props.msg.uuid)
        setActive(false)
    }, [props])

    // console.log(props.msg)

    return (
        <CSSTransition unmountOnExit in={active} timeout={700} classNames="my-node">
            <div className={`message  ${props.msg.messageId} ${!active && "fade-out"}`}>
                <div className="name name-header">
                    <span className="name">
                        <div className={`profile ${props.msg.platform}-${displayPlatform}`}>
                            <Avatar className="profile-pic" src={props.msg.avatar} alt={props.msg.displayName + " avatar"} />
                            {props.msg.platform === "twitch" &&
                            <>
                                <img 
                                    alt="" 
                                    className="chat-badge" 
                                    src={props.msg.badges.broadcaster != undefined ? broadcasterImage : 
                                            props.msg.badges.moderator != undefined ? ModeratorBadge : 
                                                props.msg.badges.vip != undefined ? VipBadge : ""}
                                />
                                <img
                                    alt=""
                                    className="sub-badge"
                                    src={subBadge}
                                />
                            </>}
                            {displayPlatform && <img width="20" src={props.msg.platform === "discord" ? discordLogo : twitchLogo} alt="platform" className={props.msg.platform} />}
                        </div>
                        <span dangerouslySetInnerHTML={{
                            __html: marked(DOMPurify.sanitize(props.msg.displayName, {
                                FORBID_ATTR: [
                                    "style",
                                    "onerror",
                                    "onload",
                                    "width",
                                    "height"
                                ],
                                FORBID_TAGS: [
                                    "table",
                                    "script",
                                    "audio",
                                    "video",
                                    "style",
                                    "iframe",
                                    "textarea",
                                    "input",
                                    "form",
                                ],
                            }
                            ))
                        }}>
                        </span>
                        
                    </span>
                    <button className="exit-button"><HighlightOffTwoToneIcon onClick={deleteMe}/></button>
                </div>
                <div className="msg-body" dangerouslySetInnerHTML={{
                    __html: marked(DOMPurify.sanitize(props.msg.body, {
                        FORBID_ATTR: [
                            "style",
                            "onerror",
                            "onload",
                            "width",
                            "height"
                        ],
                        FORBID_TAGS: [
                            "table",
                            "script",
                            "audio",
                            "video",
                            "style",
                            "iframe",
                            "textarea",
                            "input",
                            "form",
                        ],
                    }
                    ))
                }}>
                </div>
                <div className={`source ${showSource && "open"}`}>
                    <div className="source-button" onClick={() => setShowSource(s => !s)}>{!showSource ? <SettingsEthernetIcon /> : <CodeIcon/>}</div>
                    <p className="source-text">
                        {(DOMPurify.sanitize(props.msg.body, {
                            FORBID_ATTR: [
                                "style",
                                "onerror",
                                "onload",
                                "width",
                                "height"
                            ],
                            FORBID_TAGS: [
                                "table",
                                "script",
                                "audio",
                                "video",
                                "style",
                                "iframe",
                                "textarea",
                                "input",
                                "form",
                            ],
                        }))}
                    </p>
                </div>
            </div>
        </CSSTransition>
    );
}

export default Message;
