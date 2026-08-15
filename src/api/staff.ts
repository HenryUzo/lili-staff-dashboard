import { api } from "@/api/http";
import type { ManagedStaffUser, PermissionKey } from "@/types/api";

export async function getStaffUsers() {
  return (await api.get<{ items: ManagedStaffUser[] }>("/api/staff/users")).data.items;
}

export async function inviteStaffUser(input: { email: string; permissions: PermissionKey[] }) {
  return (await api.post<ManagedStaffUser>("/api/staff/users", input)).data;
}

export async function updateManagedStaffUser(id: string, input: { isActive?: boolean; permissions?: PermissionKey[] }) {
  return (await api.patch<ManagedStaffUser>(`/api/staff/users/${id}`, input)).data;
}

export async function resendStaffInvitation(id: string) {
  return (await api.post<ManagedStaffUser>(`/api/staff/users/${id}/resend-invitation`)).data;
}

export async function getStaffInvitation(token: string) {
  return (await api.get<{ email: string; expiresAt: string }>(`/api/staff/invitations/${token}`)).data;
}

export async function acceptStaffInvitation(token: string, password: string) {
  return (await api.post<{ accepted: true }>(`/api/staff/invitations/${token}/accept`, { password })).data;
}
