import { api } from "@/api/http";
import type { StaffSession } from "@/types/api";

export async function loginStaff(email: string, password: string) {
  const response = await api.post<StaffSession>("/api/staff/auth/login", { email, password });
  return response.data;
}
