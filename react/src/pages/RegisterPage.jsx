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


export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await register(email, password);
      navigate("/login");
    } catch (e2) {
      setErr(e2?.message || "Register failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={elPageBackgroundStyle}>
      <div className="el-authPage">
        <br></br>
      <h1 className="el-authTitle">Create account</h1>
      <p className="el-authSub">Save blends and manage your profile later.</p>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <label className="el-authLabel">
          Confirm password
          <input
            className="el-authInput"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <button className="el-authBtn" type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create account"}
        </button>

        <div className="el-authFooter">
          Already have one? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
    </div>
  );
}
