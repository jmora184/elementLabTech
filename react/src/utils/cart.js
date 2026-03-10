const CART_STORAGE_KEY = "el_cart";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function toSafeQuantity(value) {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty < 1) return 1;
  return Math.floor(qty);
}

function readCartRaw() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCartRaw(items) {
  if (!isBrowser()) return;
  const safe = Array.isArray(items) ? items : [];
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(
    new CustomEvent("el-cart-updated", {
      detail: {
        count: safe.reduce((sum, item) => sum + toSafeQuantity(item?.quantity), 0),
        items: safe,
      },
    })
  );
}

export function getCartItems() {
  return readCartRaw();
}

export function setCartItems(items) {
  writeCartRaw(items);
  return getCartItems();
}

export function addCartItem(item) {
  const nextItem = {
    id: String(item?.id || crypto.randomUUID()),
    productId: String(item?.productId || ""),
    collectionName: String(item?.collectionName || ""),
    profileSlug: String(item?.profileSlug || ""),
    profileName: String(item?.profileName || ""),
    size: String(item?.size || ""),
    quantity: toSafeQuantity(item?.quantity),
    unitPrice: typeof item?.unitPrice === 'number' ? item.unitPrice : undefined,
    addedAt: new Date().toISOString(),
  };

  const current = readCartRaw();
  const matchIndex = current.findIndex((row) => {
    return (
      String(row?.productId || "") === nextItem.productId &&
      String(row?.profileSlug || "") === nextItem.profileSlug &&
      String(row?.size || "") === nextItem.size
    );
  });

  if (matchIndex >= 0) {
    const merged = [...current];
    const existingQty = toSafeQuantity(merged[matchIndex]?.quantity);
    merged[matchIndex] = {
      ...merged[matchIndex],
      quantity: existingQty + nextItem.quantity,
      addedAt: nextItem.addedAt,
    };
    writeCartRaw(merged);
    return merged;
  }

  const appended = [...current, nextItem];
  writeCartRaw(appended);
  return appended;
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + toSafeQuantity(item?.quantity), 0);
}

export function removeCartItem(itemId) {
  const id = String(itemId || "");
  const next = getCartItems().filter((item) => String(item?.id || "") !== id);
  writeCartRaw(next);
  return next;
}

export function clearCart() {
  writeCartRaw([]);
  return [];
}
