import { z } from "zod";

export const uploadDokumenSchema = z.object({
  pendaftaranId: z.coerce.number().int().positive("pendaftaranId harus bilangan positif"),
});

export const listDokumenQuerySchema = z.object({
  pendaftaranId: z.coerce.number().int().positive().optional(),
});

export type UploadDokumenInput = z.infer<typeof uploadDokumenSchema>;
export type ListDokumenQuery = z.infer<typeof listDokumenQuerySchema>;
