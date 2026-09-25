// src/middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Cho phép kiểm tra health check không cần token
  if (req.path === "/health" || req.originalUrl?.includes("/health")) {
    return next();
  }
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-random-string-at-least-32-chars");
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

module.exports = authenticate;
