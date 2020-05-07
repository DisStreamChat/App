import React, { useCallback, useState, useContext} from 'react';
import firebase from "../firebase"
import "./Auth.css"
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';

const Auth = props => {
    const [id, setId] = useState()
    const [error, setError] = useState("")

    const { setUserId } = useContext(AppContext)

    const formSubmitHandler = useCallback(async e => {
        e.preventDefault()
        try {
            setError(null)
            await setUserId(id)
            await firebase.auth.signInAnonymously()
            localStorage.setItem("userId", id)
            props.history.push("/")
        } catch (err) {
            setError(err.code)
        }
    }, [props.history, id, setUserId])

    return firebase.auth.currentUser ? <Redirect to="/" /> : (
        <div className="container">
            <div className="row">
                <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
                    <div className="card card-signin my-5">
                        <div className="card-body">
                            <h5 className="card-title text-center">Sign In</h5>
                            <form className="form-signin" onSubmit={formSubmitHandler}>
                                <div className="form-label-group">
                                    <input type="text" id="inputId" value={id} onChange={e => setId(e.target.value)} className="form-control" placeholder="Email address" required autoFocus />
                                    <label htmlFor="inputId">User ID</label>
                                </div>
                                <div className="form-label-group">
                                    {error &&
                                        <p className="error">Invalid Email or Password</p>
                                    }
                                </div>
                                <button className="btn btn-lg btn-primary btn-block text-uppercase" type="submit">Sign in</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withRouter(Auth); 
