import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clearCart, getCartItems, removeCartItem, setCartItems } from "../utils/cart";

const elPageBackgroundStyle = {
  minHeight: "100vh",
  color: "#e8f3ec",
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.20), transparent 55%), " +
    "radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,0.14), transparent 60%), " +
    "linear-gradient(180deg, #070a0d 0%, #06070a 100%)",
};

const cardStyle = {
  background: "rgba(7, 10, 13, 0.82)",
  border: "1px solid rgba(110, 231, 183, 0.16)",
  borderRadius: 18,
  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
};

const checkoutPanelStyle = {
  marginTop: 24,
  padding: 18,
  borderRadius: 16,
  border: "1px solid rgba(110, 231, 183, 0.18)",
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(6,10,14,0.95))",
};

function parseUnitPrice(item) {
  const sizeText = String(item?.size || "");
  const sampleKitLike = /sample\s*kit/i.test(sizeText) || /sample\s*kit/i.test(String(item?.profileName || ""));
  if (sampleKitLike) return 199;

  const match = sizeText.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  const explicitPrice = Number(item?.unitPrice);
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return explicitPrice;

  return 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function normalizeCartItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const unitPrice = parseUnitPrice(item);
    const quantity = Math.max(1, Number(item?.quantity || 1));
    return {
      ...item,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
}

export default function CartPage() {
  const [items, setItems] = useState(() => getCartItems());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const normalizedItems = useMemo(() => normalizeCartItems(items), [items]);

  useEffect(() => {
    const handleCartUpdated = () => setItems(getCartItems());
    window.addEventListener("el-cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("el-cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function handleStripeReturn() {
      const params = new URLSearchParams(window.location.search);
      const checkoutState = params.get("checkout");
      const sessionId = params.get("session_id");

      if (checkoutState === "cancel") {
        setCheckoutMessage("Checkout was canceled. Your cart is still saved.");
        params.delete("checkout");
        params.delete("session_id");
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
        return;
      }

      if (checkoutState !== "success" || !sessionId) return;

      setCheckoutLoading(true);
      setCheckoutError("");
      setCheckoutMessage("Verifying your payment...");

      try {
        const res = await fetch(`/api/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(String(data?.error || "Could not verify checkout."));
        }

        if (ignore) return;

        if (data?.paymentStatus === "paid") {
          clearCart();
          setItems([]);
          setCheckoutMessage("Payment successful. Thank you for your order!");
        } else {
          setCheckoutMessage("Your payment session was found, but payment is not marked as paid yet.");
        }
      } catch (err) {
        if (!ignore) {
          setCheckoutError(err?.message || "Could not verify your payment.");
        }
      } finally {
        if (!ignore) {
          setCheckoutLoading(false);
          const cleanParams = new URLSearchParams(window.location.search);
          cleanParams.delete("checkout");
          cleanParams.delete("session_id");
          const nextUrl = `${window.location.pathname}${cleanParams.toString() ? `?${cleanParams.toString()}` : ""}`;
          window.history.replaceState({}, "", nextUrl);
        }
      }
    }

    handleStripeReturn();
    return () => {
      ignore = true;
    };
  }, []);

  const totalItems = useMemo(() => {
    return normalizedItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  }, [normalizedItems]);

  const subtotal = useMemo(() => {
    return normalizedItems.reduce((sum, item) => sum + Number(item?.lineTotal || 0), 0);
  }, [normalizedItems]);

  const hasUnpricedItems = useMemo(() => {
    return normalizedItems.some((item) => Number(item?.unitPrice || 0) <= 0);
  }, [normalizedItems]);

  const updateQuantity = (id, nextQty) => {
    const safeQty = Math.max(1, Number(nextQty) || 1);
    const nextItems = items.map((item) => {
      if (String(item?.id || "") !== String(id)) return item;
      return { ...item, quantity: safeQty };
    });
    setCartItems(nextItems);
  };

  const handleStripeCheckout = async () => {
    setCheckoutError("");
    setCheckoutMessage("");

    if (normalizedItems.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (hasUnpricedItems) {
      setCheckoutError("One or more cart items do not have a valid price yet.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalizedItems }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(String(data?.error || "Unable to start Stripe checkout."));
      }

      if (!data?.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err?.message || "Unable to start Stripe checkout.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div style={elPageBackgroundStyle}>
      <div className="el-authPage">
        <br />
        <h1 className="el-authTitle">Cart</h1>
        <p className="el-authSub">{totalItems} item{totalItems === 1 ? "" : "s"}</p>

        <div className="el-authCard" style={cardStyle}>
          {items.length === 0 ? (
            <p className="el-authSub" style={{ margin: 0 }}>
              Your cart is empty. <Link to="/">Continue shopping</Link>
            </p>
          ) : (
            <>
              {normalizedItems.map((item) => (
                <div key={item.id} className="el-authRow" style={{ alignItems: "flex-start", gap: 18 }}>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div className="el-authVal">{item.profileName || "Flavor Profile"}</div>
                    <div className="el-authKey">{item.collectionName || "Collection"}</div>
                    <div className="el-authKey">Size: {item.size || "N/A"}</div>
                    <div className="el-authKey" style={{ marginTop: 6 }}>
                      Unit price: {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="el-authKey">Line total: {formatCurrency(item.lineTotal)}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      className="el-authBtn"
                      type="button"
                      style={{ width: 32, padding: "4px 0" }}
                      onClick={() => updateQuantity(item.id, Number(item.quantity || 1) - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <div style={{ minWidth: 20, textAlign: "center" }}>{item.quantity || 1}</div>
                    <button
                      className="el-authBtn"
                      type="button"
                      style={{ width: 32, padding: "4px 0" }}
                      onClick={() => updateQuantity(item.id, Number(item.quantity || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      className="el-authBtn"
                      type="button"
                      style={{ width: "auto", padding: "6px 10px" }}
                      onClick={() => removeCartItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div style={checkoutPanelStyle}>
                <div className="el-authRow" style={{ alignItems: "center", marginBottom: 10 }}>
                  <div className="el-authVal">Order subtotal</div>
                  <div className="el-authVal">{formatCurrency(subtotal)}</div>
                </div>

                <div className="el-authSub" style={{ marginBottom: 14, textAlign: "left" }}>
                  You’ll be redirected to Stripe’s secure checkout page to complete payment.
                </div>

                {checkoutMessage ? (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.28)",
                      color: "#d7ffe5",
                      textAlign: "left",
                    }}
                  >
                    {checkoutMessage}
                  </div>
                ) : null}

                {checkoutError ? (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(110,231,183,0.18)",
                      color: "#d7ffe5",
                      textAlign: "left",
                    }}
                  >
                    {checkoutError}
                  </div>
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <button className="el-authBtn" type="button" onClick={() => clearCart()} disabled={checkoutLoading}>
                    Clear cart
                  </button>
                  <button
                    className="el-authBtn"
                    type="button"
                    disabled={checkoutLoading || hasUnpricedItems}
                    style={{ background: "#22c55e", color: "#fff", fontWeight: 700 }}
                    onClick={handleStripeCheckout}
                  >
                    {checkoutLoading ? "Redirecting..." : "Checkout with Stripe"}
                  </button>
                  <button
                    className="el-authBtn"
                    type="button"
                    style={{ background: "#22c55e", color: "#fff", fontWeight: 700 }}
                    onClick={() => window.open("https://calendly.com/", "_blank")}
                    disabled={checkoutLoading}
                  >
                    Set Up a Call
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
