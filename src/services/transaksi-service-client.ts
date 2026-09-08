import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export interface OwnershipResult {
  pendaftaranId: number;
  applicantId: number;
}

export async function verifyOwnership(pendaftaranId: number): Promise<OwnershipResult> {
  const url = `${env.TRANSAKSI_SERVICE_URL}/internal/pendaftaran/${pendaftaranId}/owner`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
      },
    });
  } catch (err) {
    throw new AppError(503, "Service Transaksi tidak dapat dihubungi. Silakan coba lagi nanti.");
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError(404, "Pendaftaran tidak ditemukan");
    }
    throw new AppError(503, "Service Transaksi mengembalikan error. Silakan coba lagi nanti.");
  }

  const body = (await response.json()) as { success: boolean; data?: OwnershipResult; message?: string };

  if (!body.success || !body.data) {
    throw new AppError(503, "Response tidak valid dari Service Transaksi");
  }

  return body.data;
}
