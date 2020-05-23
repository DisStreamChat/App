import React, {useState} from 'react';

import {useInterval, useEffectOnce} from "react-use"

const TimeIndicator = props => {

    const [deltaTime, setDeltaTime] = useState(0)

    useEffectOnce(() => {
        setDeltaTime((new Date().getTime() - props.time) / 1000)
    })
    
    useInterval(() => {
        setDeltaTime((new Date().getTime() - props.time) / 1000)
    }, 5000)

    return (
        <div className="time-indicator">
            {deltaTime < 60 ? `${Math.floor(deltaTime)} second${Math.floor(deltaTime) > 1 ? "s" : ""} ago` : 
             deltaTime < 3600 ? `${Math.floor(deltaTime / 60)} minute${Math.floor(deltaTime/60) > 1 ? "s" : ""} ago` : 
             deltaTime < 3600 * 12 ? `${Math.floor(deltaTime / 3600)} hour${Math.floor(deltaTime/3600) > 1 ? "s" : ""} ago` :
             deltaTime < 3600 * 12 * 7 ? `${Math.floor(deltaTime / (3600*12))} day${Math.floor(deltaTime / (3600*12)) > 1 ? "s" : ""} ago` : "A Long Time Ago"}
            
        </div>
    );
}

export default TimeIndicator;
