/**
 * Envia os 3 campos do formulário por e-mail (Resend).
 * Variáveis na Vercel: RESEND_API_KEY (obrigatória), RESEND_FROM, MAIL_TO
 * @see https://resend.com/docs/send-with-nodejs
 */

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  if (req.body != null) {
    if (Buffer.isBuffer(req.body)) {
      const raw = req.body.toString("utf8");
      return raw ? JSON.parse(raw) : {};
    }
    if (typeof req.body === "string") {
      return req.body ? JSON.parse(req.body) : {};
    }
    if (typeof req.body === "object") {
      return req.body;
    }
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { message: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const mailTo = process.env.MAIL_TO || "contato@mindmaster.com.br";

  if (!apiKey || !from) {
    return sendJson(res, 503, {
      message:
        "E-mail não configurado: defina RESEND_API_KEY e RESEND_FROM nas Environment Variables da Vercel.",
    });
  }

  let input;
  try {
    input = await readJson(req);
  } catch {
    return sendJson(res, 400, { message: "JSON inválido." });
  }

  const nome = String(input.nome || input.name || "").trim();
  const email = String(input.email || "").trim();
  const duvida = String(input.duvida || "").trim();

  if (!nome || !email || !duvida) {
    return sendJson(res, 400, {
      message: "Preencha nome, e-mail e dúvida.",
    });
  }

  const textBody =
    "Nome: " +
    nome +
    "\nE-mail: " +
    email +
    "\n\nDúvida:\n" +
    duvida +
    "\n\n---\nGestão Ágil 2.0 — formulário Suporte";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: [mailTo],
        reply_to: email,
        subject: "[Gestão Ágil 2.0] Contato — " + nome,
        text: textBody,
      }),
    });

    const raw = await r.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      /* ignore */
    }

    if (!r.ok) {
      return sendJson(res, 502, {
        message:
          (data && data.message) ||
          raw ||
          "Resend recusou o envio (verifique domínio/remetente).",
      });
    }

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("resend", err);
    return sendJson(res, 502, {
      message: "Falha ao enviar e-mail. Tente novamente.",
    });
  }
};
