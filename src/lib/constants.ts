import type { AppointmentRequestStatus } from "@/types/api";

const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:4000"
  : "";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;

export const APPOINTMENT_STATUS_OPTIONS: AppointmentRequestStatus[] = [
  "PENDING_REVIEW",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW"
];
