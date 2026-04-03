const TO = "suporte@mindmaster.com.br";
const FORMSUBMIT_URL =
  "https://formsubmit.co/ajax/" + encodeURIComponent(TO);

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

  const payload = {
    name: nome,
    email: email,
    message:
      "Dúvida:\n\n" +
      duvida +
      "\n\n---\nEnviado pelo formulário Gestão Ágil 2.0 (iframe)",
    _subject: "[Gestão Ágil 2.0] Novo chamado — " + nome,
    _captcha: false,
  };

  try {
    const r = await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* ignore */
    }
    if (!r.ok) {
      return sendJson(res, r.status || 502, {
        message:
          (data && data.message) ||
          text ||
          "Falha ao enviar ao serviço de e-mail.",
      });
    }
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("formsubmit proxy", err);
    return sendJson(res, 502, {
      message:
        "Não foi possível contatar o serviço de envio. Tente novamente.",
    });
  }
};
