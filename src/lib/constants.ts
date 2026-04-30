import type { AppointmentRequestStatus } from "@/types/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "https://lilivet.onrender.com";

export const APPOINTMENT_STATUS_OPTIONS: AppointmentRequestStatus[] = [
  "PENDING_REVIEW",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW"
];
