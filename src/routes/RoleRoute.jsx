import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to home if user does not have the required role
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
