import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    Object.assign(req.query, result.data);
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    req.params = result.data as Request["params"];
    next();
  };
}
