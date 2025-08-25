import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from '../content/AuthContext';

const LoginPage = () => {
  const { login: setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
        const res = await login(formData);
        setUser(res);
        navigate("/journal");
    } catch (err) {
      const msg = err?.response?.data?.error || "Login failed. Please check your credentials.";
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: 10, background: "#007bff", color: "#fff", border: "none", borderRadius: 5 }}>
          Login
        </button>
      </form>
      <div style={{ marginTop: 20 }}>
        No account? <Link to="/signup">Create one</Link>
      </div>
    </div>
  );
}

export default LoginPage;
