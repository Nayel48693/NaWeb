const ALLOWED_HOSTNAMES = ["nawebs.com", "www.nawebs.com", "nawebs.pages.dev"];
const RATE_LIMIT = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const jsonResponse = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

function isAllowedOrigin(value) {
  if (!value) return false;
  let url;
  try { url = new URL(value); } catch (_) { return false; }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol === "http:") return hostname === "localhost" || hostname === "127.0.0.1";
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTNAMES.some((allowed) => hostname === allowed
    || (allowed === "nawebs.pages.dev" && hostname.endsWith(`.${allowed}`)));
}

function isRateLimited(ip) {
  const now = Date.now();
  for (const [key, timestamps] of RATE_LIMIT) {
    if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) RATE_LIMIT.delete(key);
  }
  const recent = (RATE_LIMIT.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    RATE_LIMIT.set(ip, recent);
    return true;
  }
  recent.push(now);
  RATE_LIMIT.set(ip, recent);
  return false;
}

const safeText = (value, maxLength) => value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength);

export async function onRequestPost({ request, env }) {
  if (!isAllowedOrigin(request.headers.get("Origin") || request.headers.get("Referer"))) {
    return jsonResponse(403, { error: "forbidden" });
  }
  if (!env?.TELEGRAM_BOT_TOKEN || !env?.TELEGRAM_CHAT_ID) {
    return jsonResponse(503, { error: "not_configured" });
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > 1024) return jsonResponse(413, { error: "invalid_request" });
  let text;
  try { text = await request.text(); } catch (_) { return jsonResponse(400, { error: "invalid_request" }); }
  if (new TextEncoder().encode(text).byteLength > 1024) return jsonResponse(413, { error: "invalid_request" });

  let body;
  try { body = JSON.parse(text); } catch (_) { return jsonResponse(400, { error: "invalid_request" }); }
  if (!body || typeof body !== "object" || typeof body.nome !== "string"
    || typeof body.plano !== "string" || typeof body.tipoNegocio !== "string"
    || typeof body.teste !== "boolean"
    || Object.keys(body).some((key) => !["nome", "plano", "tipoNegocio", "teste"].includes(key))) {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isRateLimited(ip)) return jsonResponse(429, { error: "limit" });

  const message = body.teste
    ? "✅ Teste de notificação NaWeb"
    : [
      "🔔 Novo pedido NaWeb",
      `Nome: ${safeText(body.nome, 60)}`,
      `Plano: ${safeText(body.plano, 30)}`,
      `Negócio: ${safeText(body.tipoNegocio, 30)}`,
      "Abrir admin: https://nawebs.com/admin"
    ].join("\n");

  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message })
    });
  } catch (_) {
    return jsonResponse(502, { error: "telegram_unavailable" });
  }
  if (!response.ok) return jsonResponse(502, { error: "telegram_unavailable" });
  let result;
  try { result = await response.json(); } catch (_) { result = null; }
  return result?.ok ? jsonResponse(200, { ok: true }) : jsonResponse(502, { error: "telegram_unavailable" });
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });
  return onRequestPost({ request, env });
}
