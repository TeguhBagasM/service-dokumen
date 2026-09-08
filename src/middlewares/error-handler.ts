import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { ServiceUnavailableError } from "../utils/ServiceUnavailableError.js";
import { MulterError } from "multer";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route tidak ditemukan: ${req.method} ${req.path}` });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, message: "Ukuran file melebihi batas maksimal 5MB" });
    } else {
      res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof ServiceUnavailableError) {
    res.status(503).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }

  const prismaCode = (err as { code?: string }).code;
  if (prismaCode === "P2002") {
    res.status(409).json({ success: false, message: "Data sudah ada (duplicate)" });
    return;
  }
  if (prismaCode === "P2025") {
    res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    return;
  }

  console.error("Unhandled error:", err);
  const message = process.env.NODE_ENV === "production" ? "Terjadi kesalahan server" : err.message;
  res.status(500).json({ success: false, message });
}
