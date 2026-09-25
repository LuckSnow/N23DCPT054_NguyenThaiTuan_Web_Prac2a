// src/controllers/authController.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-random-string-at-least-32-chars";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-super-refresh-secret-string-at-least-32-chars";

// ──────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const { password: _, ...userData } = user;
    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

    const { password: _, ...userData } = user;
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        refreshToken,
        user: userData
      }
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// POST /api/auth/refresh
// ──────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp refreshToken" });
    }

    jwt.verify(token, REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "RefreshToken không hợp lệ hoặc đã hết hạn" });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
      }

      const payload = { id: user.id, email: user.email, role: user.role };
      const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

      res.json({
        success: true,
        message: "Cấp lại accessToken thành công",
        accessToken: newAccessToken
      });
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin người dùng" });
    }

    const { password: _, ...userData } = user;
    res.json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, getMe };
