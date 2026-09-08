import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5003),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET wajib diisi (min 32 karakter)"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN wajib diisi"),
  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR wajib diisi"),
  TRANSAKSI_SERVICE_URL: z.string().url("TRANSAKSI_SERVICE_URL harus valid URL"),
  INTERNAL_SERVICE_KEY: z.string().min(1, "INTERNAL_SERVICE_KEY wajib diisi"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
