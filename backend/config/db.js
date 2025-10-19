// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/learnease";
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;