import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { ServiceUnavailableError } from "../utils/ServiceUnavailableError.js";

const APPLICANT_ROLE = "applicant";
const INTERNAL_TIMEOUT_MS = 5000;

export function isApplicantRole(roleName: string): boolean {
  return roleName.toLowerCase() === APPLICANT_ROLE;
}

async function internalRequest(path: string): Promise<Response> {
  const url = `${env.TRANSAKSI_SERVICE_URL}${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INTERNAL_TIMEOUT_MS);
    try {
      return await fetch(url, {
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
}

async function readData(response: Response): Promise<{ success: boolean; data?: unknown }> {
  if (response.status === 404) {
    throw new AppError(404, "Pendaftaran tidak ditemukan");
  }
  if (!response.ok) {
    throw new ServiceUnavailableError(
      "Service Transaksi tidak dapat dihubungi. Tidak dapat memverifikasi kepemilikan pendaftaran.",
    );
  }
  const body = (await response.json()) as { success: boolean; data?: unknown };
  if (!body.success) {
    throw new ServiceUnavailableError("Response tidak valid dari Service Transaksi");
  }
  return body;
}

export async function verifyOwnership(
  pendaftaranId: number,
  requestUserId: number,
  requestUserRole: string,
): Promise<boolean> {
  if (!isApplicantRole(requestUserRole)) {
    return true;
  }

  const body = await readData(await internalRequest(`/internal/pendaftaran/${pendaftaranId}/owner`));

  const applicantId = (body.data as { applicantId?: unknown } | undefined)?.applicantId;
  if (typeof applicantId !== "number") {
    throw new ServiceUnavailableError("Response tidak valid dari Service Transaksi");
  }

  return applicantId === requestUserId;
}

export async function getPendaftaranStatus(pendaftaranId: number): Promise<string> {
  const body = await readData(await internalRequest(`/internal/pendaftaran/${pendaftaranId}/status`));

  const status = (body.data as { status?: unknown } | undefined)?.status;
  if (typeof status !== "string") {
    throw new ServiceUnavailableError("Response tidak valid dari Service Transaksi");
  }

  return status;
}