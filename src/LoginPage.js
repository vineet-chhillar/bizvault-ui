import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import logo from "./assets/brandlogo111.png"; // <-- add this at the top
function LoginPage({ sendToCSharp, loginError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔁 Reset loading on error from App.js
  useEffect(() => {
    if (loginError) {
      setError(loginError);
      setLoading(false);
    }
  }, [loginError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    sendToCSharp("Login", {
      username: email,
      password: password
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/*<div className="logo-container">
                <img src={logo} alt="DhanSutra Logo" className="app-logo" />
        </div>*/}
        <h1 className="login-title">Billhgfg arjhgge</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button disabled={loading} className="login-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
