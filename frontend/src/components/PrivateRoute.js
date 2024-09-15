import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ component: Component, ...rest }) {
  const { isAuthenticated } = useAuth();

  const checkAuthTimestamp = () => {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (!lastLoginTime) return false;

    const lastLogin = new Date(lastLoginTime);
    const now = new Date();
    const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);

    return hoursSinceLogin <= 24;
  };

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated && checkAuthTimestamp() ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
}

export default PrivateRoute;