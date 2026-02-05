import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AccountPage() {
  const { user, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="el-authPage">
        <h1 className="el-authTitle">Account</h1>
        <p className="el-authSub">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="el-authPage">
        <h1 className="el-authTitle">Account</h1>
        <p className="el-authSub">
          You’re not signed in. <Link to="/login">Login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="el-authPage">
      <h1 className="el-authTitle">Account</h1>
      <div className="el-authCard">
        <div className="el-authRow">
          <div className="el-authKey">Email</div>
          <div className="el-authVal">{user.email}</div>
        </div>

        <button
          className="el-authBtn"
          type="button"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
