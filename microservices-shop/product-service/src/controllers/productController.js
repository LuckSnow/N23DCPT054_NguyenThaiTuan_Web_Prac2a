// src/controllers/productController.js
const { PrismaClient } = require("@prisma/client");
const redis = require("../config/redis");
const prisma = new PrismaClient();

// Helper: Xóa cache sản phẩm trong Redis
const clearProductCache = async () => {
  if (!redis) return;
  try {
    const keys = await redis.keys("products:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn("⚠️ Không thể xóa cache Redis:", err.message);
  }
};

// ──────────────────────────────────
// GET /api/products — Lấy danh sách có phân trang, lọc, sắp xếp (Có Cache Redis 5 phút)
// ──────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      sortBy = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
      inStock
    } = req.query;

    const cacheKey = `products:${page}:${limit}:${search}:${category || ""}:${sortBy}:${order}:${minPrice || ""}:${maxPrice || ""}:${inStock || ""}`;

    // Kiểm tra cache Redis
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.json({
            ...JSON.parse(cachedData),
            source: "cache"
          });
        }
      } catch (cacheErr) {
        console.warn("⚠️ Đọc cache Redis lỗi:", cacheErr.message);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Xây dựng điều kiện filter
    const where = {
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(category && { category: { slug: category } }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        }
      }),
      ...(inStock === "true" && { stock: { gt: 0 } }),
    };

    // Chạy song song 2 queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { [sortBy]: order },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    const responsePayload = {
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

    // Lưu cache 5 phút (300 giây)
    if (redis) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(responsePayload));
      } catch (cacheErr) {
        console.warn("⚠️ Ghi cache Redis lỗi:", cacheErr.message);
      }
    }

    res.json({
      ...responsePayload,
      source: "database"
    });
  } catch (error) {
    next(error); // Chuyển lỗi sang errorHandler
  }
};

// ──────────────────────────────────
// GET /api/products/:id
// ──────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// POST /api/products — Xóa cache khi thêm mới
// ──────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const { name, price, description, stock, imageUrl, categoryId } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const product = await prisma.product.create({
      data: { name, slug, price, description, stock, imageUrl, categoryId },
      include: { category: true }
    });

    await clearProductCache();
    res.status(201).json({ success: true, data: product, message: "Tạo sản phẩm thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// PUT /api/products/:id — Xóa cache khi cập nhật
// ──────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { category: true }
    });

    await clearProductCache();
    res.json({ success: true, data: product, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// DELETE /api/products/:id (Soft delete) — Xóa cache khi xóa
// ──────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false } // Soft delete — không xoá thật
    });

    await clearProductCache();
    res.json({ success: true, message: "Đã ẩn sản phẩm thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
