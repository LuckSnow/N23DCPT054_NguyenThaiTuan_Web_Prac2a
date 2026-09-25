// src/routes/orderRoutes.js
const router = require("express").Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus
} = require("../controllers/orderController");

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, customerName, customerEmail, items]
 *             properties:
 *               customerId: { type: integer, example: 1 }
 *               customerName: { type: string, example: "Nguyễn Thái Tuấn" }
 *               customerEmail: { type: string, example: "tuan@example.com" }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer, example: 1 }
 *                     productName: { type: string, example: "iPhone 15 Pro" }
 *                     price: { type: number, example: 27990000 }
 *                     quantity: { type: integer, example: 1 }
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: "123 Đường ABC" }
 *                   city: { type: string, example: "TP. Hồ Chí Minh" }
 *                   district: { type: string, example: "Quận 1" }
 *               note: { type: string, example: "Giao giờ hành chính" }
 *     responses:
 *       201:
 *         description: Đơn hàng tạo thành công
 */
router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo khách hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của khách hàng
 */
router.get("/customer/:customerId", getOrdersByCustomer);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipping, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Trạng thái đơn hàng cập nhật thành công
 */
router.put("/:id/status", updateOrderStatus);

module.exports = router;
