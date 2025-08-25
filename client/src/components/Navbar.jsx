import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../content/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const linkStyle = {
        marginRight: 12,
        textDecoration: 'none',
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            marginBottom: 16,
        }}>
            <Link to="/" style={{ ...linkStyle, fontWeight: 700 }}>PJ Development</Link>
            <div>
                {user ? (
                    <>
                        <span style={{ marginRight: 12, color: "#666" }}>{user.email}</span>
                        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
                        <Link to="/journal" style={linkStyle}>Journal</Link>
                        <button onClick={handleLogout} style={{
                            padding: 8,
                            background: "#f44336",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer"
                        }}>
                            Logout
                        </button>
                    </>
            ) : ( 
                <>
                    <Link to="/login" style={linkStyle}>Login</Link>
                    <Link to="/signup" style={linkStyle}>Sign Up</Link>
                </>
                )}
            </div>
        </div>
    );
};

export default Navbar;