import { join } from "node:path";
import { stat, unlink } from "node:fs/promises";
import { fileTypeFromFile } from "file-type";
import type { Dokumen } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import {
  verifyOwnership,
  isApplicantRole,
  getPendaftaranStatus,
} from "../../services/transaksi-service-client.js";
import type { UploadDokumenInput } from "./schema.js";

const DELETEABLE_STATUSES = new Set(["draft", "revisi_diminta"]);

export interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
  destination: string;
}

type DokumenView = Omit<Dokumen, "namaFileTersimpan">;

function toDokumenView(d: Dokumen): DokumenView {
  const { namaFileTersimpan: _namaFileTersimpan, ...view } = d;
  return view;
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

  try {
    const isOwner = await verifyOwnership(input.pendaftaranId, userId, userRoleName);
    if (!isOwner) {
      throw new AppError(403, "Anda tidak memiliki akses untuk mengupload dokumen pada pendaftaran ini");
    }

    const detected = await fileTypeFromFile(file.path);
    if (!detected || detected.mime !== file.mimetype) {
      throw new AppError(400, "Tipe file tidak sesuai isi sebenarnya. Hanya PDF, JPG, PNG yang diperbolehkan");
    }

    const dokumen = await prisma.dokumen.create({
      data: {
        pendaftaranId: input.pendaftaranId,
        jenisDokumen: input.jenisDokumen,
        namaFileAsli: file.originalname,
        namaFileTersimpan: file.filename,
        mimeType: detected.mime,
        ukuranBytes: file.size,
        uploadedBy: userId,
      },
    });

    return toDokumenView(dokumen);
  } catch (err) {
    await unlink(file.path).catch(() => {});
    throw err;
  }
}

export async function listDokumenByPendaftaran(
  pendaftaranId: number,
  userId: number,
  userRoleName: string,
) {
  const isOwner = await verifyOwnership(pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda tidak memiliki akses untuk melihat dokumen pada pendaftaran ini");
  }

  const dokumen = await prisma.dokumen.findMany({
    where: { pendaftaranId },
    orderBy: { createdAt: "desc" },
  });

  return dokumen.map(toDokumenView);
}

export async function getDokumenFile(id: number, userId: number, userRoleName: string) {
  const dokumen = await prisma.dokumen.findUnique({ where: { id } });
  if (!dokumen) {
    throw new AppError(404, "Dokumen tidak ditemukan");
  }

  const isOwner = await verifyOwnership(dokumen.pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda tidak memiliki akses untuk mengunduh dokumen ini");
  }

  const filePath = join(process.cwd(), env.UPLOAD_DIR, dokumen.namaFileTersimpan);
  const exists = await stat(filePath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    throw new AppError(404, "File fisik dokumen tidak ditemukan di penyimpanan, meskipun metadata masih tercatat. Hubungi administrator.");
  }

  return { dokumen, filePath };
}

export async function deleteDokumen(id: number, userId: number, userRoleName: string) {
  const dokumen = await prisma.dokumen.findUnique({ where: { id } });
  if (!dokumen) {
    throw new AppError(404, "Dokumen tidak ditemukan");
  }

  if (!isApplicantRole(userRoleName)) {
    throw new AppError(403, "Hanya applicant pemilik dokumen yang dapat menghapus dokumen");
  }

  const isOwner = await verifyOwnership(dokumen.pendaftaranId, userId, userRoleName);
  if (!isOwner) {
    throw new AppError(403, "Anda bukan pemilik dokumen ini");
  }

  const status = await getPendaftaranStatus(dokumen.pendaftaranId);
  if (!DELETEABLE_STATUSES.has(status)) {
    throw new AppError(409, "Dokumen hanya dapat dihapus saat pendaftaran berstatus draft atau revisi_diminta");
  }

  const filePath = join(process.cwd(), env.UPLOAD_DIR, dokumen.namaFileTersimpan);

  await unlink(filePath).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") {
      throw new AppError(500, "Gagal menghapus file fisik. Metadata tetap utuh, silakan coba lagi.");
    }
  });

  try {
    await prisma.dokumen.delete({ where: { id } });
  } catch {
    throw new AppError(500, "File fisik sudah terhapus tetapi metadata gagal dihapus. Metadata dapat dibersihkan ulang.");
  }

  return toDokumenView(dokumen);
}