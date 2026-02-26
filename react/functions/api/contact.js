const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!firstName || !lastName || !email || !message) {
      return json({ ok: false, error: "Please complete all fields." }, 400);
    }
    if (!email.includes("@")) {
      return json({ ok: false, error: "Please provide a valid email." }, 400);
    }

    const resendApiKey = String(env?.RESEND_API_KEY || "").trim();
    const toEmail = String(env?.CONTACT_TO_EMAIL || "info@elementlab.shop").trim();
    const fromEmail = String(env?.CONTACT_FROM_EMAIL || "onboarding@resend.dev").trim();

    if (!resendApiKey) {
      return json({ ok: false, error: "Server is not configured for email yet (missing RESEND_API_KEY)." }, 500);
    }

    const subject = `Contact Request - ${firstName} ${lastName}`;
    const text = [
      `First Name: ${firstName}`,
      `Last Name: ${lastName}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
      <h2>New Contact Request</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; font-family: inherit;">${message}</pre>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    const resendData = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("CONTACT EMAIL ERROR:", resendData);
      return json({ ok: false, error: "Failed to send email." }, 502);
    }

    return json({ ok: true, id: resendData?.id || null });
  } catch (err) {
    console.error("CONTACT ROUTE ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
