// src/controllers/orderController.js
const mongoose = require("mongoose");
const Order = require("../models/Order");

// Tạo đơn hàng mới
const createOrder = async (req, res, next) => {
  try {
    const { customerId, customerName, customerEmail, items, shippingAddress, note } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Đơn hàng phải chứa ít nhất 1 sản phẩm" });
    }

    // Tính tổng tiền & subtotal từng item
    const processedItems = items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity,
    }));
    const totalAmount = processedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await Order.create({
      customerId: parseInt(customerId) || 1,
      customerName,
      customerEmail,
      items: processedItems,
      totalAmount,
      shippingAddress,
      note
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Lấy đơn hàng của customer, có phân trang
const getOrdersByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { customerId: parseInt(customerId) };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật trạng thái đơn hàng (Hỗ trợ cả ObjectId lẫn orderCode)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ success: false, message: "Trạng thái đơn hàng là bắt buộc" });
    }

    // Tìm theo _id hợp lệ hoặc tìm theo orderCode
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderCode: id };

    const order = await Order.findOneAndUpdate(
      query,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrdersByCustomer, updateOrderStatus };
