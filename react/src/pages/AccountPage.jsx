import React, { useEffect, useState } from "react";
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
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    setPurchasesLoading(true);
    setPurchasesError("");
    fetch("/api/user-purchases")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPurchases(data.purchases || []);
        } else {
          setPurchasesError(data.error || "Could not load purchases.");
        }
      })
      .catch(() => setPurchasesError("Could not load purchases."))
      .finally(() => setPurchasesLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <br></br>
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

        <div className="el-authCard" style={{ marginTop: 24 }}>
          <h2 className="el-authTitle" style={{ fontSize: 22, marginBottom: 12 }}>Order History</h2>
          {purchasesLoading ? (
            <div className="el-authSub">Loading purchases...</div>
          ) : purchasesError ? (
            <div className="el-authError">{purchasesError}</div>
          ) : purchases.length === 0 ? (
            <div className="el-authSub">No purchases found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    <th style={{ textAlign: "left", padding: 8 }}>Date</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Items</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Total</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    let items = [];
                    try { items = JSON.parse(p.items || "[]"); } catch {}
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: 8 }}>{new Date(p.purchased_at).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {Array.isArray(items) && items.length > 0 ? items.map((item, idx) => (
                              <li key={idx}>
                                {item.profileName || item.name || "Item"} x{item.quantity || 1}
                              </li>
                            )) : <li>—</li>}
                          </ul>
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>${Number(p.total_amount).toFixed(2)}</td>
                        <td style={{ padding: 8 }}>{p.stripe_payment_id || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
