const JSON_HEADERS = { "Content-Type": "application/json" };

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Request failed.";
    throw new Error(msg);
  }
  return data;
}

export async function register(email, password) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return handle(res);
}

export async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return handle(res);
}

export async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  return handle(res);
}

export async function me() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  return handle(res);
}
