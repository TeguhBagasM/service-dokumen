import type { NextFunction, Request, Response } from "express";

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const roleName = req.user.roleName;
    const allowed = roleName && allowedRoles.some((r) => r.toLowerCase() === roleName.toLowerCase());

    if (!allowed) {
      res.status(403).json({ success: false, message: "Forbidden: role tidak diizinkan" });
      return;
    }

    next();
  };
}
