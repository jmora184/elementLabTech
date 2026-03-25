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

const pageWrapStyle = {
  width: "min(1380px, 94vw)",
  margin: "0 auto",
  padding: "22px 0 48px",
};

const shellCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 20,
  padding: 18,
  background: "rgba(2, 10, 24, 0.58)",
  backdropFilter: "blur(6px)",
  boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
};

const STATUS_OPTIONS = ["Processing", "Shipped", "Delivered", "Cancelled"];

function jsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

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

function getItems(order) {
  const items = jsonParse(order?.items, []);
  return Array.isArray(items) ? items : [];
}

function getItemTitle(item) {
  return item?.profileName || item?.name || item?.title || "Item";
}

function getItemMeta(item, currency = "USD") {
  const parts = [];
  if (item?.collectionName) parts.push(item.collectionName);
  if (item?.sizeLabel) parts.push(item.sizeLabel);
  else if (item?.size) parts.push(item.size);
  if (item?.price != null) parts.push(formatCurrency(item.price, currency));
  return parts.join(" • ");
}

function getPaymentBadgeStyle(value) {
  const normalized = String(value || "").toLowerCase();
  if (["paid", "succeeded", "complete"].some((s) => normalized.includes(s))) {
    return {
      color: "#c7f9cc",
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
  return {
    color: "#dbeafe",
    background: "rgba(59, 130, 246, 0.16)",
    border: "1px solid rgba(96, 165, 250, 0.35)",
  };
}

function getOrderBadgeStyle(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("delivered")) {
    return {
      color: "#c7f9cc",
      background: "rgba(22, 163, 74, 0.18)",
      border: "1px solid rgba(34, 197, 94, 0.45)",
    };
  }
  if (normalized.includes("shipped")) {
    return {
      color: "#bfdbfe",
      background: "rgba(59, 130, 246, 0.16)",
      border: "1px solid rgba(96, 165, 250, 0.35)",
    };
  }
  if (normalized.includes("cancel")) {
    return {
      color: "#fecaca",
      background: "rgba(220, 38, 38, 0.16)",
      border: "1px solid rgba(248, 113, 113, 0.35)",
    };
  }
  return {
    color: "#e9d5ff",
    background: "rgba(147, 51, 234, 0.14)",
    border: "1px solid rgba(192, 132, 252, 0.35)",
  };
}

function Pill({ label, styleType }) {
  const style = styleType === "payment" ? getPaymentBadgeStyle(label) : getOrderBadgeStyle(label);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 11px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label || "—"}
    </span>
  );
}

function formatAddressLines(order) {
  const shipping = jsonParse(order?.shipping_address, null);
  if (!shipping) return ["—"];

  const root = shipping?.address ? shipping.address : shipping;
  const name = shipping?.name || order?.shipping_name || "";
  const cityLine = [root?.city, root?.state, root?.postal_code].filter(Boolean).join(", ");

  return [name, root?.line1, root?.line2, cityLine, root?.country].filter(Boolean).length
    ? [name, root?.line1, root?.line2, cityLine, root?.country].filter(Boolean)
    : ["—"];
}

function OrdersDesktopTable({ orders, formState, saveState, onChange, onSave }) {
  return (
    <div className="el-adminTableWrap">
      <table className="el-adminTable">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Payment</th>
            <th>Shipping</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const items = getItems(order);
            const state = formState[order.id] || {
              order_status: order.order_status || "Processing",
              tracking_number: order.tracking_number || "",
              carrier: order.carrier || "",
            };
            const saving = !!saveState[order.id]?.saving;
            const message = saveState[order.id]?.message || "";
            const isError = !!saveState[order.id]?.error;

            return (
              <tr key={order.id}>
                <td>
                  <div className="el-adminOrderId">Order #{order.id}</div>
                  <div className="el-adminMuted">{new Date(order.purchased_at).toLocaleString()}</div>
                  <div className="el-adminMuted" style={{ marginTop: 8 }}>
                    Total: {formatCurrency(order.total_amount, order.currency)}
                  </div>
                </td>
                <td>
                  <div className="el-adminBlock">
                    <div className="el-adminStrong">{order.shipping_name || "No shipping name"}</div>
                    <div className="el-adminMuted">{order.customer_email || order.user_email || "—"}</div>
                    <div className="el-adminAddress" style={{ marginTop: 10 }}>
                      {formatAddressLines(order).map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="el-adminItemsCell">
                    {items.length ? (
                      items.map((item, idx) => (
                        <div key={idx} className="el-adminItemRow">
                          <div className="el-adminStrong">{getItemTitle(item)}</div>
                          <div className="el-adminMuted">{getItemMeta(item, order.currency)}</div>
                          <div className="el-adminMuted">
                            Qty: {item.quantity || 1}
                            {item.lineTotal != null ? ` • ${formatCurrency(item.lineTotal, order.currency)}` : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="el-adminMuted">—</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="el-adminStack">
                    <Pill label={order.payment_status || "Paid"} styleType="payment" />
                    <Pill label={state.order_status || order.order_status || "Processing"} styleType="order" />
                    <div className="el-adminMuted" style={{ marginTop: 10, wordBreak: "break-word" }}>
                      Payment ID: {order.stripe_payment_id || "—"}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="el-adminStack">
                    <div className="el-adminMuted"><strong>Carrier:</strong> {order.carrier || "Not set"}</div>
                    <div className="el-adminMuted" style={{ wordBreak: "break-word" }}>
                      <strong>Tracking:</strong> {order.tracking_number || "Not set"}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="el-adminEditor">
                    <label className="el-adminField">
                      <span>Status</span>
                      <select
                        className="el-adminInput"
                        value={state.order_status}
                        onChange={(e) => onChange(order.id, "order_status", e.target.value)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="el-adminField">
                      <span>Carrier</span>
                      <input
                        className="el-adminInput"
                        type="text"
                        value={state.carrier}
                        onChange={(e) => onChange(order.id, "carrier", e.target.value)}
                        placeholder="UPS, USPS, FedEx..."
                      />
                    </label>
                    <label className="el-adminField">
                      <span>Tracking #</span>
                      <input
                        className="el-adminInput"
                        type="text"
                        value={state.tracking_number}
                        onChange={(e) => onChange(order.id, "tracking_number", e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </label>
                    <button className="el-adminSaveBtn" type="button" disabled={saving} onClick={() => onSave(order.id)}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    {message ? (
                      <div className={isError ? "el-adminSaveMsg el-adminSaveMsgError" : "el-adminSaveMsg"}>{message}</div>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersMobileCards({ orders, formState, saveState, onChange, onSave }) {
  return (
    <div className="el-adminCards">
      {orders.map((order) => {
        const items = getItems(order);
        const state = formState[order.id] || {
          order_status: order.order_status || "Processing",
          tracking_number: order.tracking_number || "",
          carrier: order.carrier || "",
        };
        const saving = !!saveState[order.id]?.saving;
        const message = saveState[order.id]?.message || "";
        const isError = !!saveState[order.id]?.error;

        return (
          <div className="el-adminCardMobile" key={order.id}>
            <div className="el-adminCardHead">
              <div>
                <div className="el-adminOrderId">Order #{order.id}</div>
                <div className="el-adminMuted">{new Date(order.purchased_at).toLocaleString()}</div>
              </div>
              <div className="el-adminStrong">{formatCurrency(order.total_amount, order.currency)}</div>
            </div>

            <div className="el-adminPillRow">
              <Pill label={order.payment_status || "Paid"} styleType="payment" />
              <Pill label={state.order_status || order.order_status || "Processing"} styleType="order" />
            </div>

            <div className="el-adminSectionTitle">Customer</div>
            <div className="el-adminStrong">{order.shipping_name || "No shipping name"}</div>
            <div className="el-adminMuted">{order.customer_email || order.user_email || "—"}</div>
            <div className="el-adminAddress" style={{ marginTop: 8 }}>
              {formatAddressLines(order).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>

            <div className="el-adminSectionTitle">Items</div>
            <div className="el-adminItemsCell">
              {items.length ? items.map((item, idx) => (
                <div key={idx} className="el-adminItemRow">
                  <div className="el-adminStrong">{getItemTitle(item)}</div>
                  <div className="el-adminMuted">{getItemMeta(item, order.currency)}</div>
                  <div className="el-adminMuted">
                    Qty: {item.quantity || 1}
                    {item.lineTotal != null ? ` • ${formatCurrency(item.lineTotal, order.currency)}` : ""}
                  </div>
                </div>
              )) : <div className="el-adminMuted">—</div>}
            </div>

            <div className="el-adminSectionTitle">Update Shipping</div>
            <label className="el-adminField">
              <span>Status</span>
              <select
                className="el-adminInput"
                value={state.order_status}
                onChange={(e) => onChange(order.id, "order_status", e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="el-adminField">
              <span>Carrier</span>
              <input
                className="el-adminInput"
                type="text"
                value={state.carrier}
                onChange={(e) => onChange(order.id, "carrier", e.target.value)}
                placeholder="UPS, USPS, FedEx..."
              />
            </label>
            <label className="el-adminField">
              <span>Tracking #</span>
              <input
                className="el-adminInput"
                type="text"
                value={state.tracking_number}
                onChange={(e) => onChange(order.id, "tracking_number", e.target.value)}
                placeholder="Enter tracking number"
              />
            </label>
            <button className="el-adminSaveBtn" type="button" disabled={saving} onClick={() => onSave(order.id)}>
              {saving ? "Saving..." : "Save"}
            </button>
            {message ? (
              <div className={isError ? "el-adminSaveMsg el-adminSaveMsgError" : "el-adminSaveMsg"}>{message}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOrdersPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [formState, setFormState] = useState({});
  const [saveState, setSaveState] = useState({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    fetch("/api/admin-orders", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Could not load orders.");
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data.orders) ? data.orders : [];
        setOrders(rows);
        const initialState = {};
        rows.forEach((row) => {
          initialState[row.id] = {
            order_status: row.order_status || "Processing",
            tracking_number: row.tracking_number || "",
            carrier: row.carrier || "",
          };
        });
        setFormState(initialState);
      })
      .catch((err) => {
        if (!cancelled) setOrdersError(err?.message || "Could not load orders.");
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const state = formState[order.id] || order;
      const statusValue = String(state.order_status || order.order_status || "Processing").toLowerCase();
      if (statusFilter !== "all" && statusValue !== statusFilter) return false;

      if (!q) return true;

      const haystack = [
        String(order.id || ""),
        order.shipping_name,
        order.customer_email,
        order.user_email,
        order.stripe_payment_id,
        order.tracking_number,
        order.carrier,
        state.tracking_number,
        state.carrier,
        ...getItems(order).map((item) => `${getItemTitle(item)} ${getItemMeta(item, order.currency)}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, formState, query, statusFilter]);

  function updateField(orderId, field, value) {
    setFormState((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value,
      },
    }));
  }

  async function saveOrder(orderId) {
    const payload = formState[orderId];
    if (!payload) return;

    setSaveState((prev) => ({
      ...prev,
      [orderId]: { saving: true, error: false, message: "" },
    }));

    try {
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Could not save order.");
      }

      const updated = data.order;
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
      setFormState((prev) => ({
        ...prev,
        [orderId]: {
          order_status: updated.order_status || "Processing",
          tracking_number: updated.tracking_number || "",
          carrier: updated.carrier || "",
        },
      }));
      setSaveState((prev) => ({
        ...prev,
        [orderId]: { saving: false, error: false, message: "Saved." },
      }));
    } catch (err) {
      setSaveState((prev) => ({
        ...prev,
        [orderId]: { saving: false, error: true, message: err?.message || "Could not save order." },
      }));
    }
  }

  if (loading) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <br />
          <br />
          <h1 className="el-authTitle">Admin Orders</h1>
          <p className="el-authSub">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage">
          <h1 className="el-authTitle">Admin Orders</h1>
          <p className="el-authSub">
            You’re not signed in. <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div style={elPageBackgroundStyle}>
        <div className="el-authPage" style={{ maxWidth: 720, paddingTop: 24 }}>
          <h1 className="el-authTitle">Admin Orders</h1>
          <div className="el-authCard">
            <div className="el-authError" style={{ marginBottom: 16 }}>
              This page is for admins only.
            </div>
            <button className="el-authBtn" type="button" onClick={() => navigate("/account")}>
              Back to Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={elPageBackgroundStyle}>
      <style>{`
        .el-adminHero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .el-adminSub {
          margin: 6px 0 0;
          opacity: 0.82;
          font-size: 15px;
        }
        .el-adminTopActions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .el-adminGhostBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: #fff;
          text-decoration: none;
          cursor: pointer;
        }
        .el-adminTools {
          display: grid;
          grid-template-columns: minmax(240px, 1.35fr) minmax(180px, 0.5fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .el-adminInput,
        .el-adminSearch {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.30);
          color: inherit;
        }
        .el-adminSearch::placeholder,
        .el-adminInput::placeholder {
          color: rgba(232,243,236,0.5);
        }
        .el-adminSummary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .el-adminSummaryChip {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          font-size: 13px;
          color: rgba(232,243,236,0.92);
        }
        .el-adminTableWrap {
          width: 100%;
          overflow-x: auto;
        }
        .el-adminTable {
          width: 100%;
          min-width: 1180px;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .el-adminTable th,
        .el-adminTable td {
          vertical-align: top;
          padding: 16px 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: left;
        }
        .el-adminTable th {
          font-size: 13px;
          letter-spacing: 0.03em;
          color: rgba(232,243,236,0.72);
          font-weight: 700;
          background: rgba(255,255,255,0.02);
        }
        .el-adminOrderId {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .el-adminStrong {
          font-weight: 700;
          color: #f5fbf7;
        }
        .el-adminMuted {
          color: rgba(232,243,236,0.74);
          font-size: 14px;
          line-height: 1.45;
        }
        .el-adminAddress,
        .el-adminBlock,
        .el-adminStack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .el-adminItemsCell {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .el-adminItemRow {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }
        .el-adminEditor {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .el-adminField {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: rgba(232,243,236,0.82);
        }
        .el-adminSaveBtn {
          padding: 10px 12px;
          border-radius: 12px;
          border: 2px solid #22c55e;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .el-adminSaveBtn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .el-adminSaveMsg {
          font-size: 13px;
          color: #bbf7d0;
        }
        .el-adminSaveMsgError {
          color: #fecaca;
        }
        .el-adminCards {
          display: none;
        }
        .el-adminCardMobile {
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          padding: 16px;
          background: rgba(255,255,255,0.035);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .el-adminCardHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .el-adminPillRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .el-adminSectionTitle {
          margin-top: 2px;
          font-size: 13px;
          letter-spacing: 0.03em;
          color: rgba(232,243,236,0.68);
          text-transform: uppercase;
          font-weight: 800;
        }
        @media (max-width: 980px) {
          .el-adminTools {
            grid-template-columns: 1fr;
          }
          .el-adminTableWrap {
            display: none;
          }
          .el-adminCards {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>

      <div style={pageWrapStyle}>
        <div style={shellCardStyle}>
          <div className="el-adminHero">
            <div>
              <h1 className="el-authTitle" style={{ marginBottom: 0 }}>Admin Orders</h1>
              <p className="el-adminSub">Review purchases and update order status, tracking number, and carrier.</p>
            </div>
            <div className="el-adminTopActions">
              <Link className="el-adminGhostBtn" to="/account">Back to Account</Link>
            </div>
          </div>

          <div className="el-adminTools">
            <input
              className="el-adminSearch"
              type="text"
              placeholder="Search by order #, customer name, email, item, tracking..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="el-adminInput"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status.toLowerCase()}>{status}</option>
              ))}
            </select>
          </div>

          <div className="el-adminSummary">
            <div className="el-adminSummaryChip">Total orders: {orders.length}</div>
            <div className="el-adminSummaryChip">Showing: {filteredOrders.length}</div>
          </div>

          {ordersLoading ? (
            <div className="el-authSub">Loading orders...</div>
          ) : ordersError ? (
            <div className="el-authError">{ordersError}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="el-authSub">No matching orders found.</div>
          ) : (
            <>
              <OrdersDesktopTable
                orders={filteredOrders}
                formState={formState}
                saveState={saveState}
                onChange={updateField}
                onSave={saveOrder}
              />
              <OrdersMobileCards
                orders={filteredOrders}
                formState={formState}
                saveState={saveState}
                onChange={updateField}
                onSave={saveOrder}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
