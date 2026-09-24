// src/index.js
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

const startServer = async () => {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log(" Connected to MongoDB");
    } catch (err) {
      console.warn(" MongoDB connection warning:", err.message);
    }
  } else {
    console.warn(" MONGODB_URI is not defined in environment variables");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Order Service running on port ${PORT}`);
    console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  });
};

startServer();
