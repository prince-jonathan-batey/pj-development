import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../content/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
