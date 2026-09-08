import { AppError } from "./AppError.js";

export class ServiceUnavailableError extends AppError {
  constructor(message = "Layanan tidak tersedia. Silakan coba lagi nanti.") {
    super(503, message);
    this.name = "ServiceUnavailableError";
  }
}