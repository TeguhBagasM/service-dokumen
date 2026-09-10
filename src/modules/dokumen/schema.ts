import { z } from "zod";

export const uploadDokumenSchema = z.object({
  pendaftaranId: z.coerce.number().int().positive("pendaftaranId harus bilangan positif"),
  jenisDokumen: z.enum(["KTP", "KK", "Ijazah", "Surat Rekomendasi"], {
    error: "jenisDokumen harus salah satu dari KTP, KK, Ijazah, Surat Rekomendasi",
  }),
});

export const pendaftaranIdParamSchema = z.object({
  pendaftaranId: z.coerce.number().int().positive("pendaftaranId harus bilangan positif"),
});

export type UploadDokumenInput = z.infer<typeof uploadDokumenSchema>;