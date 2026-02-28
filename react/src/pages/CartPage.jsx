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


export default function CartPage() {
  const [items, setItems] = useState(() => getCartItems());

  useEffect(() => {
    const handleCartUpdated = () => setItems(getCartItems());
    window.addEventListener("el-cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("el-cart-updated", handleCartUpdated);
    };
  }, []);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  }, [items]);

  const updateQuantity = (id, nextQty) => {
    const safeQty = Math.max(1, Number(nextQty) || 1);
    const nextItems = items.map((item) => {
      if (String(item?.id || "") !== String(id)) return item;
      return { ...item, quantity: safeQty };
    });
    setCartItems(nextItems);
  };

  return (
    <div style={elPageBackgroundStyle}>
      <div className="el-authPage">
        <br></br>
      <h1 className="el-authTitle">Cart</h1>
      <p className="el-authSub">{totalItems} item{totalItems === 1 ? "" : "s"}</p>

      <div className="el-authCard">
        {items.length === 0 ? (
          <p className="el-authSub" style={{ margin: 0 }}>
            Your cart is empty. <Link to="/">Continue shopping</Link>
          </p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="el-authRow" style={{ alignItems: "flex-start" }}>
                <div style={{ textAlign: "left" }}>
                  <div className="el-authVal">{item.profileName || "Flavor Profile"}</div>
                  <div className="el-authKey">{item.collectionName || "Collection"}</div>
                  <div className="el-authKey">Size: {item.size || "N/A"}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

            <button className="el-authBtn" type="button" onClick={() => clearCart()}>
              Clear cart
            </button>
            <button
              className="el-authBtn"
              type="button"
              style={{ marginTop: 12, background: '#7c3aed', color: '#fff', fontWeight: 700 }}
              onClick={() => {
                // TODO: Implement checkout logic or navigation
                alert('Checkout coming soon!');
              }}
            >
              Checkout
            </button>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
