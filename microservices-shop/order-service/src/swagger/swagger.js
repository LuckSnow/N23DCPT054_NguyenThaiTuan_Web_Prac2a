// src/swagger/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service API",
      version: "1.0.0",
      description: "API quản lý đơn hàng — Lab 2 Microservices",
    },
    servers: [
      { url: "http://localhost:3002", description: "Direct Order Service" },
      { url: "http://localhost:3000", description: "Via API Gateway" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        OrderItem: {
          type: "object",
          required: ["productId", "productName", "price", "quantity"],
          properties: {
            productId: { type: "integer", example: 1 },
            productName: { type: "string", example: "iPhone 15 Pro" },
            price: { type: "number", example: 27990000 },
            quantity: { type: "integer", example: 1 },
            subtotal: { type: "number", example: 27990000 }
          }
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", example: "650c1f1e9b1d8b2bad123456" },
            orderCode: { type: "string", example: "ORD-20260924-0001" },
            customerId: { type: "integer", example: 1 },
            customerName: { type: "string", example: "Nguyễn Thái Tuấn" },
            customerEmail: { type: "string", example: "tuan@example.com" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderItem" }
            },
            totalAmount: { type: "number", example: 27990000 },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
              example: "pending"
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
