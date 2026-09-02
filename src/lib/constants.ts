import type { AppointmentRequestStatus } from "@/types/api";

const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://127.0.0.1:4000"
  : "https://lilivet.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;

export const APPOINTMENT_STATUS_OPTIONS: AppointmentRequestStatus[] = [
  "PENDING_REVIEW",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW"
];
