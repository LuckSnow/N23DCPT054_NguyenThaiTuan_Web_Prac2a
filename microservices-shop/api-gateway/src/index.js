// src/index.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const authenticate = require("./middleware/auth");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));

// Rate limiting: tối đa 100 request / 15 phút / IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", gateway: true }));

// ─── Route: /api/auth → Auth Service ──────────
app.use(createProxyMiddleware({
  pathFilter: "/api/auth",
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3003",
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(503).json({ message: "Auth Service không khả dụng" })
  }
}));

// ─── Route: /api/products → Product Service ───
app.use(createProxyMiddleware({
  pathFilter: "/api/products",
  target: process.env.PRODUCT_SERVICE_URL || "http://localhost:3001",
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(503).json({ message: "Product Service không khả dụng" })
  }
}));

// ─── Route: /api/orders → Order Service (Yêu cầu 2: Xác thực JWT) ───
app.use("/api/orders", authenticate);
app.use(createProxyMiddleware({
  pathFilter: "/api/orders",
  target: process.env.ORDER_SERVICE_URL || "http://localhost:3002",
  changeOrigin: true,
  on: {
    error: (err, req, res) => res.status(503).json({ message: "Order Service không khả dụng" })
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
