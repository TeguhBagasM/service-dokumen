import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized: token tidak ditemukan" });
    return;
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized: token tidak valid atau kedaluwarsa" });
    return;
  }

  if (payload.type !== "access") {
    res.status(401).json({ success: false, message: "Unauthorized: token bukan access token" });
    return;
  }

  req.user = {
    id: payload.userId,
    roleId: payload.roleId,
    roleName: payload.roleName,
  };
  next();
}
