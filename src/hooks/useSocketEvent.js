import { useEffect, useRef} from "react";
import { eventNames } from "node-notifier";

export default function useSocketEvent(socket, event, func) {
    useEffect(() => {
        if (socket) {
			socket.removeListener(event);
			socket.on(event, func);
			return () => socket.removeListener(event);
		}
    }, [socket, event, func])
}