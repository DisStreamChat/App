import React, { useState, useCallback } from "react";
import DOMPurify from "dompurify";
import marked from "marked"
import Avatar from "@material-ui/core/Avatar";
import HighlightOffTwoToneIcon from '@material-ui/icons/HighlightOffTwoTone';
import SettingsEthernetIcon from '@material-ui/icons/SettingsEthernet';
import { CSSTransition } from "react-transition-group"
import CodeIcon from '@material-ui/icons/Code';
import "./Message.css"

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

const Message = props => {
    const [active, setActive] = useState(true)
    const [showSource, setShowSource] = useState(false)

    const deleteMe = useCallback(() => {
        props.delete(props.msg.uuid)
        setActive(false)
    }, [props])

    console.log(props.msg)

    return (
        <CSSTransition unmountOnExit in={active} timeout={700} classNames="my-node">
            <div className={`message ${props.msg.platform}-message ${props.msg.messageId} ${!active && "fade-out"}`}>
                <div className="name name-header">
                    <span className="name">
                        <div className="profile">
                            <Avatar className="profile-pic" src={props.msg.avatar} alt={props.msg.displayName + " avatar"} />
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
                                src={props.msg.badges.subscriber != undefined && defaultSubBadge}
                            />
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
                    <button className="exit-button"><HighlightOffTwoToneIcon onClick={deleteMe}  /></button>
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