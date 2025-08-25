import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api/auth";
import { useAuth } from '../content/AuthContext';

const SignupPage = () => {
  const { login: setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
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
      const res = await signup(formData);
      setUser(res);
      navigate("/journal");
    } catch (err) {
      const msg = err?.response?.data?.error || "Signup failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
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
          Sign Up
        </button>
      </form>
      <div style={{ marginTop: 20 }}>
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default SignupPage;
