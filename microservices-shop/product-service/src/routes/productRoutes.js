// src/routes/productRoutes.js
const router = require("express").Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");
const { productValidation } = require("../middleware/validate");

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Lọc theo slug danh mục
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, price, createdAt], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedProducts"
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               description: { type: string }
 *               stock: { type: integer }
 *               categoryId: { type: integer }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       422:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/", productValidation, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa mềm sản phẩm (ẩn sản phẩm) theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đã ẩn sản phẩm thành công
 */
router.delete("/:id", deleteProduct);

const upload = require("../middleware/upload");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/products/{id}/image:
 *   post:
 *     summary: Tải ảnh sản phẩm lên
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Tải ảnh lên thành công
 */
router.post("/:id/image", upload.single("image"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm phải là một số hợp lệ" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn file ảnh để tải lên" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const product = await prisma.product.update({
      where: { id: numId },
      data: { imageUrl }
    });
    res.json({
      success: true,
      message: "Tải ảnh lên thành công",
      data: { id: product.id, imageUrl: product.imageUrl }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
