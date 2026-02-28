import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const elPageBackgroundStyle = {
  minHeight: "100vh",
  color: "#e8f3ec",
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), " +
    "radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), " +
    "linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
};


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
    <div style={elPageBackgroundStyle}>
      <div className="el-authPage">
        <br></br>
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
    </div>
  );
}
