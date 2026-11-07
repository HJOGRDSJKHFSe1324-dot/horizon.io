type Provider = "console" | "resend" | "sendgrid" | "gmail";

function provider(): Provider {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return "console";
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  const from = process.env.EMAIL_FROM || "HORIZON <no-reply@horizon.local>";
  if (provider() === "resend") {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html: html || text, text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.message || `Resend failed (${r.status})`);
    return data;
  }
  if (provider() === "sendgrid") {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from.match(/<(.+)>/)?.[1] || from },
        subject,
        content: [{ type: "text/html", value: html || text || "" }, ...(text ? [{ type: "text/plain", value: text }] : [])],
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`SendGrid failed (${r.status}): ${t}`);
    }
    return { ok: true };
  }
  if (provider() === "gmail") {
    const nodemailer = await import("nodemailer");
    console.log("[EMAIL][GMAIL] starting send to", to);
    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const info = await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, text, html });
    console.log("[EMAIL][GMAIL] sent", info.messageId);
    return { ok: true, provider: "gmail", messageId: info.messageId };
  }
  console.log(`[EMAIL][CONSOLE] ${from} -> ${to}\nSubject: ${subject}\n${text || html || ""}`);
  return { ok: true, provider: "console" };
}