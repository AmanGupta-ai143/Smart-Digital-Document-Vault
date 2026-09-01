require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const contactRoutes = require("./routes/contacts");
const reminderRoutes = require("./routes/reminders");
const searchRoutes = require("./routes/search");
const activityRoutes = require("./routes/activity");
const settingsRoutes = require("./routes/settings");
const notificationRoutes = require("./routes/notifications");
const webauthnRoutes = require("./routes/webauthn");

const app = express();

connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webauthn", webauthnRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] DocMind AI API running on port ${PORT}`));

module.exports = app;
