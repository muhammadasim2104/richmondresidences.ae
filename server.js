#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT || 4174);

function loadEnvFile(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function apiHandler(name) {
  return require(path.join(ROOT, "api", `${name}.js`));
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT, cleaned);
}

function serveStatic(req, res, urlPath) {
  let filePath = safeJoin(urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = TYPES[ext] || "application/octet-stream";
  send(res, 200, fs.readFileSync(filePath), { "Content-Type": type });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    const name = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const allowed = ["enquire", "events", "config", "geo", "form-draft"];
    if (!allowed.includes(name)) {
      send(res, 404, JSON.stringify({ ok: false }), { "Content-Type": "application/json" });
      return;
    }
    try {
      await apiHandler(name)(req, res);
    } catch (err) {
      console.error("[richmond:dev-server]", err);
      if (!res.headersSent) {
        send(res, 500, JSON.stringify({ ok: false, message: "Server error" }), {
          "Content-Type": "application/json",
        });
      }
    }
    return;
  }

  try {
    const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
    const target = pathname === "/" ? "/index.html" : normalized.endsWith("/") ? `${normalized}index.html` : pathname;
    serveStatic(req, res, target);
  } catch (err) {
    console.error("[richmond:static]", err);
    send(res, 500, "Server error", { "Content-Type": "text/plain; charset=utf-8" });
  }
});

server.listen(PORT, () => {
  console.log(`Richmond Residences local preview: http://localhost:${PORT}/`);
});
