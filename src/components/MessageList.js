import React from "react"
import { TransitionGroup } from "react-transition-group";
import { Message } from "chatbits";

const Messages = React.memo(props => {
	return (
		<TransitionGroup>
			{props.messages.map((msg, i) => (
				<Message
                    // TODO: add functions for accept and deny, also improve click handler
                    accept={console.log}
                    deny={console.log}
					index={msg.id}
					forwardRef={props.unreadMessageHandler}
					streamerInfo={props.settings}
					delete={props.removeMessage}
					timeout={props.timeout}
					ban={props.ban}
					key={msg.id}
					msg={msg}
					pin={() => props.pin(msg.id)}
				/>
			))}
		</TransitionGroup>
	);
});

export default Messages
