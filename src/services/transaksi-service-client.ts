import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { ServiceUnavailableError } from "../utils/ServiceUnavailableError.js";

const APPLICANT_ROLE = "applicant";
const OWNERSHIP_TIMEOUT_MS = 5000;

export function isApplicantRole(roleName: string): boolean {
  return roleName.toLowerCase() === APPLICANT_ROLE;
}

export async function verifyOwnership(
  pendaftaranId: number,
  requestUserId: number,
  requestUserRole: string,
): Promise<boolean> {
  if (!isApplicantRole(requestUserRole)) {
    return true;
  }

  const url = `${env.TRANSAKSI_SERVICE_URL}/internal/pendaftaran/${pendaftaranId}/owner`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OWNERSHIP_TIMEOUT_MS);
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new ServiceUnavailableError(
      "Service Transaksi tidak dapat dihubungi. Tidak dapat memverifikasi kepemilikan pendaftaran.",
    );
  }

  if (response.status === 404) {
    throw new AppError(404, "Pendaftaran tidak ditemukan");
  }

  if (!response.ok) {
    throw new ServiceUnavailableError(
      "Service Transaksi tidak dapat dihubungi. Tidak dapat memverifikasi kepemilikan pendaftaran.",
    );
  }

  const body = (await response.json()) as {
    success: boolean;
    data?: { applicantId?: number };
  };

  if (!body.success || typeof body.data?.applicantId !== "number") {
    throw new ServiceUnavailableError("Response tidak valid dari Service Transaksi");
  }

  return body.data.applicantId === requestUserId;
}