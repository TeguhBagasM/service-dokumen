import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { upload } from "../../middlewares/upload.js";
import { validateBody, validateParams } from "../../middlewares/validate.js";
import { uploadRateLimiter } from "../../middlewares/rate-limit.js";
import { idParamSchema } from "../../utils/schemas.js";
import { uploadDokumenSchema, pendaftaranIdParamSchema } from "./schema.js";
import * as controller from "./controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/upload",
  uploadRateLimiter,
  upload.single("file"),
  validateBody(uploadDokumenSchema),
  controller.upload,
);

router.get(
  "/pendaftaran/:pendaftaranId",
  validateParams(pendaftaranIdParamSchema),
  controller.listByPendaftaran,
);

router.get(
  "/:id/file",
  validateParams(idParamSchema),
  controller.streamById,
);

router.delete(
  "/:id",
  validateParams(idParamSchema),
  controller.remove,
);

export default router;