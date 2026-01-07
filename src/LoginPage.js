import React, { useState } from "react";
import "./LoginPage.css";


function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");


  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock role-based login
    if (email && password) {
      onLogin({ email, role });
      
    } else {
      alert("Please enter your email and password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">jghgfgghf</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
            <option value="Accountant">Accountant</option>
            <option value="Staff">Staff</option>
            <option value="Viewer">Viewer</option>
          </select>

          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}
export default LoginPage;
