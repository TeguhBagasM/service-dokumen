import { createReadStream } from "node:fs";
import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import * as dokumenService from "./service.js";
import type { MulterFile } from "./service.js";
import type { UploadDokumenInput } from "./schema.js";

export async function upload(req: Request, res: Response) {
  const input = req.body as UploadDokumenInput;
  const file = req.file as unknown as MulterFile | undefined;

  const result = await dokumenService.uploadDokumen(
    file!,
    input,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Dokumen berhasil diupload", result, 201);
}

export async function listByPendaftaran(req: Request, res: Response) {
  const pendaftaranId = Number(req.params["pendaftaranId"]);

  const result = await dokumenService.listDokumenByPendaftaran(
    pendaftaranId,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Daftar dokumen berhasil diambil", result);
}

export async function streamById(req: Request, res: Response) {
  const id = Number(req.params["id"]);

  const { dokumen, filePath } = await dokumenService.getDokumenFile(
    id,
    req.user!.id,
    req.user!.roleName,
  );

  const safeName = dokumen.namaFileAsli.replace(/[^a-zA-Z0-9._-]/g, "_");
  res.setHeader("Content-Type", dokumen.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(dokumen.namaFileAsli)}`,
  );
  res.setHeader("Content-Length", String(dokumen.ukuranBytes));

  const stream = createReadStream(filePath);
  stream.on("error", (err) => {
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: "File fisik dokumen tidak ditemukan di penyimpanan.",
      });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params["id"]);

  const result = await dokumenService.deleteDokumen(
    id,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Dokumen berhasil dihapus", result);
}