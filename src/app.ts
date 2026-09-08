import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRateLimiter } from "./middlewares/rate-limit.js";
import { notFoundHandler, errorHandler } from "./middlewares/error-handler.js";
import dokumenRoutes from "./modules/dokumen/routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json());
  app.use(apiRateLimiter);

  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "service-dokumen" });
  });

  app.use("/dokumen/dokumen", dokumenRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
