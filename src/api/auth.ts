import { api } from "@/api/http";
import type { StaffLoginResult, StaffMfaEnrollmentResult, StaffMfaSetup, StaffSession } from "@/types/api";

export async function loginStaff(email: string, password: string) {
  const response = await api.post<StaffLoginResult>("/api/staff/auth/login", { email, password });
  return response.data;
}

export async function getStaffSession() {
  return (await api.get<StaffSession>("/api/staff/auth/session")).data;
}

export async function logoutStaff() {
  await api.post("/api/staff/auth/logout");
}

export async function startMfaEnrollment(setupToken: string) {
  return (await api.post<StaffMfaSetup>("/api/staff/auth/mfa/setup", {}, { headers: { Authorization: `Bearer ${setupToken}` } })).data;
}

export async function confirmMfaEnrollment(setupToken: string, code: string) {
  return (await api.post<StaffMfaEnrollmentResult>("/api/staff/auth/mfa/setup/verify", { code }, { headers: { Authorization: `Bearer ${setupToken}` } })).data;
}

export async function verifyMfaChallenge(challengeToken: string, code: string) {
  return (await api.post<StaffSession>("/api/staff/auth/mfa/verify", { code }, { headers: { Authorization: `Bearer ${challengeToken}` } })).data;
}
