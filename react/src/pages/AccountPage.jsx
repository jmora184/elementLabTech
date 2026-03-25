import React, { useEffect, useMemo, useState } from "react";
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

const accountPageWideStyle = {
  width: "min(1200px, 92vw)",
  maxWidth: 1200,
  margin: "0 auto",
  padding: "20px 16px 40px",
};

const accountCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
  background: "rgba(2, 10, 24, 0.55)",
  backdropFilter: "blur(6px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
};

function formatCurrency(value, currency = "USD") {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeAddress(purchase) {
  const raw = parseJson(purchase?.shipping_address, null);
  if (!raw) return null;
  if (raw.address) {
    return {
      name: raw.name || purchase?.shipping_name || "",
      address: raw.address,
    };
  }
  return {
    name: purchase?.shipping_name || "",
    address: raw,
  };
}

function formatShippingLines(purchase) {
  const details = normalizeAddress(purchase);
  if (!details?.address) return ["—"];

  const address = details.address;
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(", ");
  const lines = [
    details.name,
    address.line1,
    address.line2,
    cityLine,
    address.country,
  ].filter(Boolean);

  return lines.length ? lines : ["—"];
}

function getItems(purchase) {
  const items = parseJson(purchase?.items, []);
  return Array.isArray(items) ? items : [];
}

function getItemTitle(item) {
  return item?.profileName || item?.name || item?.title || "Item";
}

function getItemMeta(item) {
  const pieces = [];
  if (item?.collectionName) pieces.push(item.collectionName);
  if (item?.sizeLabel) pieces.push(item.sizeLabel);
  else if (item?.size) pieces.push(item.size);
  if (item?.price != null) pieces.push(formatCurrency(item.price));
  return pieces.filter(Boolean).join(" • ");
}

function getTrackingLabel(purchase) {
  const parts = [];
  if (purchase?.carrier) parts.push(`Carrier: ${purchase.carrier}`);
  if (purchase?.tracking_number) parts.push(`Tracking: ${purchase.tracking_number}`);
  return parts.length ? parts.join(" • ") : "—";
}

function badgeStyle(type, value) {
  const normalized = String(value || "").toLowerCase();

  if (type === "payment") {
    if (["paid", "succeeded", "complete"].some((s) => normalized.includes(s))) {
      return {
        color: "#b8f7d0",
        background: "rgba(22, 163, 74, 0.18)",
        border: "1px solid rgba(34, 197, 94, 0.45)",
      };
    }
    if (["pending", "unpaid", "requires"].some((s) => normalized.includes(s))) {
      return {
        color: "#fde68a",
        background: "rgba(202, 138, 4, 0.16)",
        border: "1px solid rgba(250, 204, 21, 0.4)",
      };
    }
  }

  if (type === "order") {
    if (normalized.includes("delivered")) {
      return {
        color: "#c7f9cc",
        background: "rgba(34, 197, 94, 0.14)",
        border: "1px solid rgba(34, 197, 94, 0.35)",
      };
    }
    if (normalized.includes("shipped")) {
      return {
        color: "#bfdbfe",
        background: "rgba(59, 130, 246, 0.16)",
        border: "1px solid rgba(96, 165, 250, 0.35)",
      };
    }
  }

  return {
    color: "#dbeafe",
    background: "rgba(37, 99, 235, 0.14)",
    border: "1px solid rgba(96, 165, 250, 0.28)",
  };
}

function StatusBadge({ type, value, prefix }) {
  const label = value || "—";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...badgeStyle(type, label),
      }}
    >
      {prefix ? `${prefix}: ${label}` : label}
    </span>
  );
}

function DesktopOrderTable({ purchases }) {
  return (
    <div className="el-orderTableWrap">
      <table className="el-orderTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Items Purchased</th>
            <th>Ship To</th>
            <th>Tracking</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase, index) => {
            const items = getItems(purchase);
            const shippingLines = formatShippingLines(purchase);
            return (
              <tr key={purchase.id || index}>
                <td>
                  <div className="el-orderDate">Order #{index + 1}</div>
                  <div className="el-orderMuted">{new Date(purchase.purchased_at).toLocaleString()}</div>
                  {purchase.stripe_payment_id ? (
                    <div className="el-orderMuted" style={{ marginTop: 8 }}>
                      Payment ID: {purchase.stripe_payment_id}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                    <StatusBadge type="payment" value={purchase.payment_status || "Paid"} prefix="Payment" />
                    <StatusBadge type="order" value={purchase.order_status || "Processing"} prefix="Order" />
                  </div>
                </td>
                <td>
                  <div className="el-orderTotal">{formatCurrency(purchase.total_amount, purchase.currency)}</div>
                </td>
                <td>
                  <div className="el-itemsCell">
                    {items.length ? (
                      items.map((item, itemIndex) => (
                        <div key={itemIndex} className="el-itemRow">
                          <div className="el-itemTitle">{getItemTitle(item)}</div>
                          <div className="el-orderMuted">{getItemMeta(item)}</div>
                          <div className="el-orderMuted">
                            Qty: {item.quantity || 1}
                            {item.lineTotal != null ? ` • Line total: ${formatCurrency(item.lineTotal, purchase.currency)}` : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="el-orderMuted">—</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="el-addressCell">
                    {shippingLines.map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="el-addressCell" style={{ whiteSpace: "pre-line" }}>{getTrackingLabel(purchase)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileOrderCards({ purchases }) {
  return (
    <div className="el-orderCards">
      {purchases.map((purchase, index) => {
        const items = getItems(purchase);
        const shippingLines = formatShippingLines(purchase);
        return (
          <div key={purchase.id || index} className="el-orderCardMobile">
            <div className="el-orderCardTop">
              <div>
                <div className="el-orderDate">Order #{index + 1}</div>
                <div className="el-orderMuted">{new Date(purchase.purchased_at).toLocaleString()}</div>
              </div>
              <div className="el-mobileTotal">{formatCurrency(purchase.total_amount, purchase.currency)}</div>
            </div>

            <div className="el-mobileBadgeRow">
              <StatusBadge type="payment" value={purchase.payment_status || "Paid"} prefix="Payment" />
              <StatusBadge type="order" value={purchase.order_status || "Processing"} prefix="Order" />
            </div>

            {purchase.stripe_payment_id ? (
              <div className="el-mobileSection">
                <div className="el-mobileLabel">Payment ID</div>
                <div className="el-mobileValue break-anywhere">{purchase.stripe_payment_id}</div>
              </div>
            ) : null}

            <div className="el-mobileSection">
              <div className="el-mobileLabel">Items Purchased</div>
              <div className="el-itemsCell">
                {items.length ? (
                  items.map((item, itemIndex) => (
                    <div key={itemIndex} className="el-itemRow">
                      <div className="el-itemTitle">{getItemTitle(item)}</div>
                      <div className="el-orderMuted">{getItemMeta(item)}</div>
                      <div className="el-orderMuted">
                        Qty: {item.quantity || 1}
                        {item.lineTotal != null ? ` • Line total: ${formatCurrency(item.lineTotal, purchase.currency)}` : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="el-orderMuted">—</span>
                )}
              </div>
            </div>

            <div className="el-mobileGrid2">
              <div className="el-mobileSection">
                <div className="el-mobileLabel">Ship To</div>
                <div className="el-addressCell">
                  {shippingLines.map((line, lineIndex) => (
                    <div key={lineIndex}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="el-mobileSection">
                <div className="el-mobileLabel">Tracking</div>
                <div className="el-mobileValue" style={{ whiteSpace: "pre-line" }}>{getTrackingLabel(purchase)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

  const orderSummaryText = useMemo(() => {
    if (!purchases.length) return "No purchases yet.";
    return `${purchases.length} order${purchases.length === 1 ? "" : "s"} found.`;
  }, [purchases.length]);

  if (loading) {
    return (
      <div style={elPageBackgroundStyle}>
        <div style={accountPageWideStyle}>
          <h1 className="el-authTitle">Account</h1>
          <p className="el-authSub">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={elPageBackgroundStyle}>
        <div style={accountPageWideStyle}>
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
      <style>{`
        .break-anywhere { overflow-wrap: anywhere; word-break: break-word; }
        .el-accountHeaderRow {
          display: grid;
          grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        .el-orderTableWrap {
          width: 100%;
        }
        .el-orderTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .el-orderTable th,
        .el-orderTable td {
          padding: 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          vertical-align: top;
          text-align: left;
        }
        .el-orderTable th {
          color: rgba(232,243,236,0.78);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .el-orderDate {
          font-weight: 800;
          color: #f5faf7;
          margin-bottom: 6px;
        }
        .el-orderMuted {
          color: rgba(232,243,236,0.72);
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .el-orderTotal {
          font-size: 20px;
          font-weight: 800;
          color: #f5faf7;
          white-space: nowrap;
        }
        .el-itemsCell,
        .el-addressCell {
          display: grid;
          gap: 10px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }
        .el-itemRow {
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .el-itemTitle {
          font-weight: 800;
          color: #f8fffb;
          margin-bottom: 4px;
        }
        .el-orderCards {
          display: none;
        }
        .el-orderCardMobile {
          display: grid;
          gap: 14px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .el-orderCardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .el-mobileTotal {
          font-size: 18px;
          font-weight: 800;
          color: #f5faf7;
          white-space: nowrap;
        }
        .el-mobileBadgeRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .el-mobileGrid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .el-mobileSection {
          display: grid;
          gap: 8px;
        }
        .el-mobileLabel {
          color: rgba(232,243,236,0.72);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .el-mobileValue {
          color: #f5faf7;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .el-accountHeaderRow {
            grid-template-columns: 1fr;
          }
          .el-orderTable th,
          .el-orderTable td {
            padding: 14px 10px;
          }
        }

        @media (max-width: 768px) {
          .el-orderTableWrap {
            display: none;
          }
          .el-orderCards {
            display: grid;
            gap: 14px;
          }
        }

        @media (max-width: 640px) {
          .el-mobileGrid2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={accountPageWideStyle}>
        <h1 className="el-authTitle">Account</h1>
        <p className="el-authSub">Manage your profile and review your order history.</p>

        <div className="el-accountHeaderRow">
          <div className="el-authCard" style={accountCardStyle}>
            <div className="el-authRow">
              <div className="el-authKey">Email</div>
              <div className="el-authVal break-anywhere">{user.email}</div>
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

          <div className="el-authCard" style={accountCardStyle}>
            <h2 className="el-authTitle" style={{ fontSize: 24, marginBottom: 8 }}>
              Order History
            </h2>
            <p className="el-authSub" style={{ marginBottom: 0 }}>
              {orderSummaryText}
            </p>
          </div>
        </div>

        <div className="el-authCard" style={{ ...accountCardStyle, marginTop: 24 }}>
          {purchasesLoading ? (
            <div className="el-authSub">Loading purchases...</div>
          ) : purchasesError ? (
            <div className="el-authError">{purchasesError}</div>
          ) : purchases.length === 0 ? (
            <div className="el-authSub">No purchases found.</div>
          ) : (
            <>
              <DesktopOrderTable purchases={purchases} />
              <MobileOrderCards purchases={purchases} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
