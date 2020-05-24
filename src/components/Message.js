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
import Tooltip from '@material-ui/core/Tooltip';
import TimeIndicator from "./TimeIndicator";

let renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
    let link = marked.Renderer.prototype.link.apply(this, arguments);
    return link.replace("<a", "<a target='_blank'");
};

marked.setOptions({
    renderer: renderer
});

const discordLogo = "https://i.imgur.com/ZOKp8LH.png"
const twitchLogo = "https://cdn.vox-cdn.com/thumbor/hSP3rKWFHC7hbbtpCp_DIKiRSDI=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/2937002/twitch.0.jpg"

const Message = props => {
    const [active, setActive] = useState(true)
    const [showSource, setShowSource] = useState(false)
    const [displayPlatform, setDisplayPlatform] = useState(true)
    const [showSourceButton, setShowSourceButton] = useState(false)

    const { streamerInfo } = useContext(AppContext)

    useEffect(() => {
        setDisplayPlatform(streamerInfo.displayPlatform)
        setShowSourceButton(streamerInfo.showSourceButton)
    }, [streamerInfo])

    useEffect(() => {
        setActive(!props.msg.deleted)
    }, [props])

    const deleteMe = useCallback(() => {
        console.log(props.msg.platform)
        props.delete(props.msg.uuid, props.msg.platform)
        // setActive(false)
    }, [props])

    return (
        <CSSTransition unmountOnExit in={active} timeout={700} classNames="my-node">
            <div className={`message ${props.msg.messageId} ${displayPlatform === "full" && props.msg.platform+"-message"} ${!active && "fade-out"}`}>
                <div className="name msg-header">
                    <span className="name">
                        <div className={`profile ${props.msg.platform}-${displayPlatform}`}>
                            <Avatar className="profile-pic" src={props.msg.avatar} alt={props.msg.displayName + " avatar"} />
                            {props.msg.badges.subscriber &&
                                <Tooltip arrow title={props.msg.badges.subscriber.title} placement="top"><img className="sub-badge" src={props.msg.badges.subscriber.image} alt=""></img></Tooltip>
                            }
                            {Object.entries(props.msg.badges).map((badge, i) => {
                                return badge[0] !== "subscriber" ? <Tooltip arrow title={badge[1].title} placement="top"><img src={badge[1].image} alt="" className={`chat-badge badge-${i}`}></img></Tooltip>:<></>
                            })}
                        </div>
                        <span>{props.msg.displayName}</span>
                        {displayPlatform === "medium" && <Tooltip title={props.msg.platform} placement="top" arrow><img width="20" src={props.msg.platform === "discord" ? discordLogo : twitchLogo} alt="platform" className={"chat-badge " + props.msg.platform} /></Tooltip>}
                    </span>
                    <button className="exit-button"><HighlightOffTwoToneIcon onClick={deleteMe}/></button>
                </div>
                <div className="msg-body another class" dangerouslySetInnerHTML={{
                    __html: marked(DOMPurify.sanitize(props.msg.body, {
                        FORBID_ATTR: [
                            "style",
                            "onerror",
                            "onload",
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
                    }))
                }}>
                </div>
                <div className="message-footer">
                    <div className={`source ${showSource && "open"}`}>{showSourceButton &&
                    <>
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
                    </>}
                </div>
                    <TimeIndicator time={props.msg.sentAt}/>
                </div>
            </div>
        </CSSTransition>
    );
}

export default Message;
