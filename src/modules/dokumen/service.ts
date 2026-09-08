import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { verifyOwnership, isApplicantRole } from "../../services/transaksi-service-client.js";
import type { UploadDokumenInput } from "./schema.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAGIC_SIGNATURES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

const EXTENSION_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

function detectMimeType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_SIGNATURES)) {
    for (const sig of signatures) {
      if (buffer.length >= sig.length && sig.every((byte, i) => buffer[i] === byte)) {
        return mimeType;
      }
    }
  }
  return null;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export async function uploadDokumen(
  file: MulterFile,
  input: UploadDokumenInput,
  userId: number,
  userRoleName: string,
) {
  if (!file) {
    throw new AppError(400, "File wajib diupload");
  }

  const detectedMime = detectMimeType(file.buffer);
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    throw new AppError(400, "Tipe file tidak diizinkan. Hanya PDF, JPG, JPEG, PNG yang diperbolehkan");
  }

  const ext = EXTENSION_MAP[detectedMime];
  if (!ext) {
    throw new AppError(400, "Tipe file tidak didukung");
  }

  const isOwner = await verifyOwnership(input.pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda tidak memiliki akses untuk mengupload dokumen pada pendaftaran ini");
  }

  const filename = `${randomUUID()}${ext}`;

  const uploadDir = join(process.cwd(), env.UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), file.buffer);

  const dokumen = await prisma.dokumen.create({
    data: {
      namaFileAsli: file.originalname,
      tipeMime: detectedMime,
      ekstensi: ext,
      ukuran: file.size,
      path: filename,
      pendaftaranId: input.pendaftaranId,
      userId,
    },
  });

  return dokumen;
}

export async function listDokumen(
  pendaftaranId: number | undefined,
  userId: number,
  userRoleName: string,
) {
  if (pendaftaranId) {
    const isOwner = await verifyOwnership(pendaftaranId, userId, userRoleName);
    if (!isOwner) {
      throw new AppError(403, "Anda tidak memiliki akses untuk melihat dokumen pada pendaftaran ini");
    }

    return prisma.dokumen.findMany({
      where: { pendaftaranId },
      orderBy: { createdAt: "desc" },
    });
  }

  if (isApplicantRole(userRoleName)) {
    return prisma.dokumen.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.dokumen.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDokumenById(id: number, userId: number, userRoleName: string) {
  const dokumen = await prisma.dokumen.findUnique({ where: { id } });
  if (!dokumen) {
    throw new AppError(404, "Dokumen tidak ditemukan");
  }

  const isOwner = await verifyOwnership(dokumen.pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda tidak memiliki akses untuk melihat dokumen ini");
  }

  return dokumen;
}

export async function deleteDokumen(id: number, userId: number, userRoleName: string) {
  const dokumen = await prisma.dokumen.findUnique({ where: { id } });
  if (!dokumen) {
    throw new AppError(404, "Dokumen tidak ditemukan");
  }

  const isOwner = await verifyOwnership(dokumen.pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda tidak memiliki akses untuk menghapus dokumen ini");
  }

  const uploadDir = join(process.cwd(), env.UPLOAD_DIR);
  await unlink(join(uploadDir, dokumen.path)).catch(() => {});

  await prisma.dokumen.delete({ where: { id } });

  return dokumen;
}