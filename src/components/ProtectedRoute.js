import React from "react";
import { Route, Redirect } from "react-router-dom";
import firebase from "../firebase";

const ProtectedRoute = React.memo(({ component: RouteComponent, ...rest }) => {
	return <Route {...rest} render={routeProps => (!!firebase.auth.currentUser ? <RouteComponent {...routeProps} /> : <Redirect to="/login" />)} />;
});

export default ProtectedRoute;
