import React, { useEffect } from "react";
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

export default function AccountPage() {
  const { user, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <br></br>
          <h1 className="el-authTitle">Account</h1>
          <p className="el-authSub">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <h1 className="el-authTitle">Account</h1>
          <p className="el-authSub">
            You’re not signed in. <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={elPageBackgroundStyle}>
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
    </div>
  );
}
