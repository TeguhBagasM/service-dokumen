import type { Response } from "express";

export function sendSuccess(res: Response, message: string, data?: unknown, status = 200) {
  res.status(status).json({ success: true, message, ...(data !== undefined && { data }) });
}

export function sendError(res: Response, message: string, status = 500, errors?: unknown[]) {
  res.status(status).json({ success: false, message, ...(errors !== undefined && { errors }) });
}
