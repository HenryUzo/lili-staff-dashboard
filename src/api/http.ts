import axios from "axios";
import type { AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants";
import type { ApiErrorPayload } from "@/types/api";

let unauthorizedHandler: (() => void) | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/api/staff/auth/")) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.error?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
