const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas using the URI in the environment.
 * Fails fast and loudly if the connection cannot be established,
 * since nothing in the app is safe to run without a database.
 */
async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: process.env.NODE_ENV !== "production",
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
