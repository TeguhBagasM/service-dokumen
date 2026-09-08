import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import * as dokumenService from "./service.js";
import type { MulterFile } from "./service.js";
import type { UploadDokumenInput, ListDokumenQuery } from "./schema.js";

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

export async function list(req: Request, res: Response) {
  const query = (req.validatedQuery ?? {}) as ListDokumenQuery;

  const result = await dokumenService.listDokumen(
    query.pendaftaranId,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Daftar dokumen berhasil diambil", result);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params["id"]);

  const result = await dokumenService.getDokumenById(
    id,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Dokumen berhasil diambil", result);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params["id"]);

  await dokumenService.deleteDokumen(
    id,
    req.user!.id,
    req.user!.roleName,
  );

  sendSuccess(res, "Dokumen berhasil dihapus");
}
