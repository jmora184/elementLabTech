import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/account");
    } catch (e2) {
      setErr(e2?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="el-authPage">
      <h1 className="el-authTitle">Login</h1>
      <p className="el-authSub">Welcome back.</p>

      <form className="el-authCard" onSubmit={onSubmit}>
        {err ? <div className="el-authError">{err}</div> : null}

        <label className="el-authLabel">
          Email
          <input
            className="el-authInput"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="el-authLabel">
          Password
          <input
            className="el-authInput"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <button className="el-authBtn" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <div className="el-authFooter">
          No account? <Link to="/register">Create one</Link>
        </div>
      </form>
    </div>
  );
}
