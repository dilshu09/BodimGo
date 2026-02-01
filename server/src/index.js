import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

// Routes
import authRoutes from "./routes/auth.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import agreementTemplateRoutes from "./routes/agreementTemplate.routes.js";
import seekerRoutes from "./routes/seeker.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import reportRoutes from "./routes/report.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const __dirname = path.resolve();

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5174",
      process.env.PROVIDER_URL || "http://localhost:5175",
    ],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5174",
      process.env.PROVIDER_URL || "http://localhost:5175",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/agreements/templates", agreementTemplateRoutes);
app.use("/api/seekers", seekerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
// Basic Route
app.get("/", (req, res) => {
  res.send("BodimGo API Server Running");
});

// Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

export { app, io };
