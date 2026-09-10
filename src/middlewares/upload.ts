import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const EXTENSION_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadDir = join(process.cwd(), env.UPLOAD_DIR);
mkdirSync(uploadDir, { recursive: true });

/**
 * PERINGATAN KEAMANAN:
 * fileFilter di bawah HANYA memeriksa Content-Type header yang dikirim client
 * (file.mimetype) — nilai ini BISA DIPALSUKAN. Jadi lapisan ini hanya
 * titik awal, bukan otorisasi tipe file yang final.
 *
 * Maka SETELAH file diterima oleh multer (ditulis ke diskStorage), Wajib
 * tambahkan validasi magic number/file signature (misal library `file-type`)
 * di layer service SEBELUM record disimpan permanen ke database:
 *   - baca hasil deteksi dari file yang sudah ditulis
 *   - kalau magic number TIDAK cocok whitelist (atau berbeda dari mimeType
 *     yang diklaim client), hapus file yang sudah terlanjur ditulis ke disk
 *     dan return 400.
 */
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = EXTENSION_MAP[file.mimetype];
      if (!ext) {
        cb(new AppError(400, "Tipe file tidak didukung"), "");
        return;
      }
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          "Tipe file tidak diizinkan. Hanya PDF, JPG, JPEG, PNG yang diperbolehkan",
        ),
      );
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});