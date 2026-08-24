const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 25000);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        deepseekKeyLoaded: !!DEEPSEEK_API_KEY,
        model: DEEPSEEK_MODEL
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/deepseek/plan") {
      await handleDeepSeekPlan(req, res);
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(url.pathname, res, req.method === "HEAD");
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`AI Club workflow server: http://localhost:${PORT}`);
  console.log(`[DeepSeek] model=${DEEPSEEK_MODEL}; key=${DEEPSEEK_API_KEY ? "loaded" : "missing"}`);
});

async function handleDeepSeekPlan(req, res) {
  const startedAt = Date.now();
  console.log(`[DeepSeek] request received ${new Date().toLocaleTimeString()}`);
  if (!DEEPSEEK_API_KEY) {
    console.log("[DeepSeek] missing API key");
    sendJson(res, 500, { error: "Missing DEEPSEEK_API_KEY. Set it in .env or the shell environment." });
    return;
  }

  const body = await readJsonBody(req);
  console.log(`[DeepSeek] idea="${String(body.idea || "").slice(0, 80)}"`);
  const messages = buildPlannerMessages(body);

  let response;
  try {
    response = await callDeepSeek(messages, true);
    if (!response.ok && response.status === 400) {
      console.log("[DeepSeek] retrying without response_format after 400");
      response = await callDeepSeek(messages, false);
    }
  } catch (error) {
    console.log(`[DeepSeek] upstream error after ${Date.now() - startedAt}ms: ${error.message}`);
    sendJson(res, 504, { error: `DeepSeek request failed or timed out: ${error.message}` });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  console.log(`[DeepSeek] upstream status=${response.status}; elapsed=${Date.now() - startedAt}ms`);
  if (!response.ok) {
    console.log(`[DeepSeek] upstream error payload=${JSON.stringify(payload).slice(0, 500)}`);
    sendJson(res, response.status, {
      error: payload.error?.message || payload.message || "DeepSeek API request failed"
    });
    return;
  }

  const content = payload.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { reply: content };
  }

  sendJson(res, 200, parsed);
  console.log(`[DeepSeek] response sent; total=${Date.now() - startedAt}ms`);
}

async function callDeepSeek(messages, useJsonFormat) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  const body = {
    model: DEEPSEEK_MODEL,
    messages,
    temperature: 0.25,
    max_tokens: 1800
  };
  if (useJsonFormat) body.response_format = { type: "json_object" };

  try {
    return await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify(body)
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildPlannerMessages(body) {
  const selectedHistory = Array.isArray(body.selectedHistory) ? body.selectedHistory : [];
  const currentPlan = body.currentPlan || {};
  const recentMessages = Array.isArray(body.messages)
    ? body.messages
        .filter(item => item && item.role && item.text && !item.loading)
        .slice(-6)
        .map(item => `${item.role}: ${item.text}`)
        .join("\n")
    : "";
  const historyText = selectedHistory.length
    ? selectedHistory.map(item => `- ${item.title}: ${(item.tags || []).join("、")}；${item.summary}`).join("\n")
    : "用户未指定历史活动，请按通用社团活动经验处理。";

  return [
    {
      role: "system",
      content: [
        "你是社团活动 AI 策划助手，帮助用户把模糊活动想法完善为可执行的拟策划案。",
        "当前阶段不要生成预算表，也不要给出预算明细；只能提示预算风险和后续核算重点。",
        "你必须具备基本常识和校园社团安全判断：夜间/深夜活动、酒精、咖啡因、食品饮品、校外场地、返程安全、噪音、审批、未成年人或学生参与等都需要审慎评估。",
        "如果用户提出晚上举办咖啡、酒、饮品、校外聚会等活动，不要直接认可；应指出时间、安全、健康、合规与返程风险，并建议改为下午或傍晚早段、无酒精、低咖啡因或校内可控场地。",
        "不要把用户原始问题原样写进活动意义。活动意义必须提炼为社团价值、参与者价值、组织沉淀价值。",
        "活动名称 name 必须是你创作的短名称，像真实活动品牌名，建议 4-12 个中文字符，可有创意但不能浮夸；禁止照搬用户输入的完整句子。",
        "活动主题 theme 必须是策划案中的主题表达，说明活动核心媒介、对象和价值，例如“以无酒精饮品为媒介的校园故事交换与社群连接活动”；theme 不能和 name 完全相同。",
        "必须根据需求具体填充策划案字段，不能用空泛模板。若信息缺失，要合理假设并在风险/建议里标明待确认。",
        "评分必须按 5 个维度计算，每项 0-20 分：目标清晰度、安全与合规、资源复杂度、时间合理性、参与体验。总分为五项相加，不允许固定使用 84/100 或固定“中等”。",
        "必须输出严格 JSON，不要 Markdown，不要额外解释。",
        "JSON 顶层字段：reply, draftPlan, feasibilityReport。",
        "draftPlan 字段：name, theme, objective, dateYear, dateMonth, dateDay, targetAudience, countPerSession, sessions, purpose, contentFlow, requirements, execution, riskPlan。",
        "feasibilityReport 字段：score, level, criteria, risks, suggestions。criteria 是数组，每项包含 name, score, reason；risks 和 suggestions 必须是字符串数组。",
        "内容要适合中文社团活动场景，落地、具体、不过度宏大。"
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        idea: body.idea || "",
        activityName: body.activityName || "",
        currentPlan,
        selectedHistory: historyText,
        recentMessages
      })
    }
  ];
}

function serveStatic(urlPath, res, headOnly) {
  const decoded = decodeURIComponent(urlPath);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(ROOT, "." + cleanPath);

  if (!filePath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(headOnly ? undefined : data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
