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

const sectionCardStyle = {
  background: "rgba(7, 10, 13, 0.82)",
  border: "1px solid rgba(110, 231, 183, 0.16)",
  borderRadius: 18,
  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
};

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
    }).format(Number(value || 0));
  } catch {
    return `$${Number(value || 0).toFixed(2)}`;
  }
}

function titleCase(text) {
  return String(text || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseItems(itemsValue) {
  try {
    const parsed = JSON.parse(itemsValue || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseShippingDetails(purchase) {
  let raw = null;
  try {
    raw = purchase?.shipping_address ? JSON.parse(purchase.shipping_address) : null;
  } catch {
    raw = null;
  }

  if (raw?.address) {
    return {
      name: raw?.name || purchase?.shipping_name || "",
      address: raw.address,
    };
  }

  if (raw && typeof raw === "object") {
    return {
      name: purchase?.shipping_name || "",
      address: raw,
    };
  }

  return null;
}

function formatShippingAddress(purchase) {
  const details = parseShippingDetails(purchase);
  const address = details?.address || null;

  if (!address && purchase?.shipping_address1) {
    return purchase.shipping_address1;
  }

  if (!address) return "—";

  return [
    details?.name || purchase?.shipping_name || null,
    address.line1 || null,
    address.line2 || null,
    [address.city || null, address.state || null].filter(Boolean).join(", ") || null,
    [address.postal_code || null, address.country || null].filter(Boolean).join(" ") || null,
  ]
    .filter(Boolean)
    .join(", ");
}

function StatusBadge({ label, tone = "neutral" }) {
  const palette = {
    success: {
      background: "rgba(34,197,94,0.16)",
      border: "rgba(34,197,94,0.32)",
      color: "#c7f9d4",
    },
    warning: {
      background: "rgba(245,158,11,0.16)",
      border: "rgba(245,158,11,0.32)",
      color: "#fde7bf",
    },
    danger: {
      background: "rgba(239,68,68,0.16)",
      border: "rgba(239,68,68,0.32)",
      color: "#ffd2d2",
    },
    info: {
      background: "rgba(59,130,246,0.16)",
      border: "rgba(59,130,246,0.32)",
      color: "#d3e5ff",
    },
    neutral: {
      background: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.14)",
      color: "#eaf7ee",
    },
  };

  const colors = palette[tone] || palette.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
        background: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.color,
      }}
    >
      {label}
    </span>
  );
}

function getPaymentTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "paid") return "success";
  if (value === "processing" || value === "requires_payment_method") return "warning";
  if (value === "failed" || value === "unpaid" || value === "no_payment_required") return "danger";
  return "neutral";
}

function getOrderTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "processing" || value === "paid") return "info";
  if (value === "shipped" || value === "delivered") return "success";
  if (value === "payment_failed" || value === "cancelled" || value === "canceled") return "danger";
  if (value === "pending_payment") return "warning";
  return "neutral";
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

    let cancelled = false;

    async function loadPurchases() {
      setPurchasesLoading(true);
      setPurchasesError("");

      try {
        const res = await fetch("/api/user-purchases");
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || !data?.ok) {
          setPurchasesError(data?.error || "Could not load purchases.");
          setPurchases([]);
          return;
        }

        setPurchases(Array.isArray(data?.purchases) ? data.purchases : []);
      } catch {
        if (!cancelled) {
          setPurchasesError("Could not load purchases.");
        }
      } finally {
        if (!cancelled) {
          setPurchasesLoading(false);
        }
      }
    }

    loadPurchases();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const purchaseCount = useMemo(() => purchases.length, [purchases]);

  if (loading) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <br />
          <br />
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

        <div className="el-authCard" style={sectionCardStyle}>
          <div className="el-authRow">
            <div className="el-authKey">Email</div>
            <div className="el-authVal">{user.email}</div>
          </div>

          <div className="el-authRow">
            <div className="el-authKey">Orders</div>
            <div className="el-authVal">{purchaseCount}</div>
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

        <div className="el-authCard" style={{ ...sectionCardStyle, marginTop: 24 }}>
          <h2 className="el-authTitle" style={{ fontSize: 22, marginBottom: 12 }}>
            Order History
          </h2>

          {purchasesLoading ? (
            <div className="el-authSub">Loading purchases...</div>
          ) : purchasesError ? (
            <div className="el-authError">{purchasesError}</div>
          ) : purchases.length === 0 ? (
            <div className="el-authSub">No purchases found yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {purchases.map((purchase) => {
                const items = parseItems(purchase?.items);
                const paymentStatus = purchase?.payment_status || "unknown";
                const orderStatus = purchase?.order_status || (paymentStatus === "paid" ? "processing" : "pending_payment");
                const shippingAddress = formatShippingAddress(purchase);

                return (
                  <div
                    key={purchase.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 16,
                      padding: 16,
                      background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(6,10,14,0.95))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                          Order #{purchase.id}
                        </div>
                        <div style={{ opacity: 0.82, fontSize: 14 }}>
                          {purchase?.purchased_at ? new Date(purchase.purchased_at).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <StatusBadge label={`Payment: ${titleCase(paymentStatus)}`} tone={getPaymentTone(paymentStatus)} />
                        <StatusBadge label={`Order: ${titleCase(orderStatus)}`} tone={getOrderTone(orderStatus)} />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Total</div>
                        <div style={{ fontWeight: 700 }}>
                          {formatCurrency(purchase?.total_amount, purchase?.currency || "USD")}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Payment ID</div>
                        <div style={{ wordBreak: "break-word" }}>{purchase?.stripe_payment_id || "—"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Session ID</div>
                        <div style={{ wordBreak: "break-word" }}>{purchase?.stripe_session_id || "—"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Customer Email</div>
                        <div>{purchase?.customer_email || user.email || "—"}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 6 }}>Items Purchased</div>
                      {items.length === 0 ? (
                        <div style={{ opacity: 0.8 }}>—</div>
                      ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                          {items.map((item, index) => {
                            const quantity = Math.max(1, Number(item?.quantity || 1));
                            const unitPrice = Number(item?.unitPrice || 0);
                            const lineTotal = Number.isFinite(Number(item?.lineTotal))
                              ? Number(item.lineTotal)
                              : unitPrice * quantity;

                            return (
                              <div
                                key={`${purchase.id}-${index}`}
                                style={{
                                  padding: 10,
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>
                                  {item?.profileName || item?.name || "Item"}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.86, marginTop: 2 }}>
                                  {[item?.collectionName, item?.size].filter(Boolean).join(" • ") || "Item details unavailable"}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.86, marginTop: 4 }}>
                                  Qty: {quantity}
                                  {unitPrice > 0 ? ` • ${formatCurrency(unitPrice, purchase?.currency || item?.currency || "USD")} each` : ""}
                                  {lineTotal > 0 ? ` • Line total: ${formatCurrency(lineTotal, purchase?.currency || item?.currency || "USD")}` : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Ship To</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{shippingAddress}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>Tracking</div>
                        <div>
                          {purchase?.tracking_number
                            ? `${purchase?.carrier ? `${purchase.carrier}: ` : ""}${purchase.tracking_number}`
                            : "Not shipped yet"}
                        </div>
                        {purchase?.shipped_at ? (
                          <div style={{ marginTop: 6, fontSize: 14, opacity: 0.78 }}>
                            Shipped: {new Date(purchase.shipped_at).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
