import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom'
import firebase from "./firebase"

import Home from "./App"
import Auth from "./components/Auth"
import 'bootstrap/dist/css/bootstrap.min.css';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from "react-loader"
import {AppContext} from "./contexts/AppContext"

// https://distwitchchat-backend.herokuapp.com/


const App = () => {
    const [firebaseInit, setFirebaseInit] = useState(false)
    const [userId, setUserId] = useState("")
    const [streamerInfo, setStreamerInfo] = useState({})

    // this allows me to show the loading spinner until firebase is ready
    useEffect(() => {
        (async () => {
            const result = await firebase.isInitialized();
            setFirebaseInit(result)
        })()
    }, [])

    return firebaseInit !== false ? (
        <AppContext.Provider
            value={{
                userId,
                setUserId,
                streamerInfo,
                setStreamerInfo
            }}
        >
            <Router>
                <Switch>
                    <ProtectedRoute exact path="/" component={Home} />
                    <div className="App">
                        <Route path="/login" component={Auth} />
                    </div>
                    <Redirect to="/"/>
                </Switch>
            </Router>
        </AppContext.Provider>
    ) : <main className="App">
        <Loader
            loaded={false}
            lines={15}
            length={0}
            width={15}
            radius={35}
            corners={1}
            rotate={0}
            direction={1}
            color="#fff"
            speed={1}
            trail={60}
            shadow={true}
            hwaccel={true}
            className="spinner"
            zIndex={2e9}
            top="50%"
            left="50%"
            scale={3.0}
            loadedClassName="loadedContent"
        />
    </main>
}

ReactDOM.render(
    <App/>,
    document.getElementById("root")
    
)
