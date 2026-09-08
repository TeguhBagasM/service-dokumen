import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.js";
import { uploadRateLimiter } from "../../middlewares/rate-limit.js";
import { idParamSchema } from "../../utils/schemas.js";
import { uploadDokumenSchema, listDokumenQuerySchema } from "./schema.js";
import * as controller from "./controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.use(authenticate);

router.post(
  "/",
  uploadRateLimiter,
  upload.single("file"),
  validateBody(uploadDokumenSchema),
  controller.upload,
);

router.get(
  "/",
  validateQuery(listDokumenQuerySchema),
  controller.list,
);

router.get(
  "/:id",
  validateParams(idParamSchema),
  controller.getById,
);

router.delete(
  "/:id",
  validateParams(idParamSchema),
  controller.remove,
);

export default router;
