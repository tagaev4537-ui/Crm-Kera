import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import exchangeRateRoutes from "./routes/exchangeRateRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { apiRateLimiter, notFoundHandler, errorHandler } from "./middleware/security.js";

const app = express();

app.set("trust proxy", 1); // Railway работает за прокси

app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", apiRateLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/exchange-rate", exchangeRateRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CRM API запущен на порту ${PORT}`);
});
