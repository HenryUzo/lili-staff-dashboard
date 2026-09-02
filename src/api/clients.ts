import { api } from "@/api/http";
import type { ClientDetail, ClientDirectoryItem, ClientImportRun, ClientLifecycleRecord, CursorListResponse } from "@/types/api";

export async function getClients(input: { search?: string; consent?: "EMAIL" | "SMS" | "NONE"; cursor?: string | null; limit?: number }) {
  const response = await api.get<CursorListResponse<ClientDirectoryItem>>("/api/clients", { params: { ...input, limit: input.limit ?? 50, cursor: input.cursor ?? undefined } });
  return response.data;
}

export async function getClient(ownerId: string) {
  const response = await api.get<ClientDetail>(`/api/clients/${ownerId}`);
  return response.data;
}

export type ClientLifecycleUpdate = {
  leadSource?: string | null;
  referredBy?: string | null;
  regularVeterinarian?: string | null;
  firstVisitType?: string | null;
  doctorSeen?: string | null;
  recheckRecommended?: boolean;
  recheckScheduled?: boolean;
  recheckDate?: string | null;
  recheckCompleted?: boolean;
  followUpNeeded?: boolean;
  firstVisitRevenue?: number | null;
  additionalServicesRevenue?: number | null;
  wellnessPlan?: string | null;
  clientStatus?: "ACTIVE" | "INACTIVE" | "DECEASED";
  lastVisitAt?: string | null;
  nextAppointmentAt?: string | null;
  notes?: string | null;
};

export async function updateClientLifecycle(ownerId: string, lifecycleId: string, input: ClientLifecycleUpdate) {
  const response = await api.patch<ClientLifecycleRecord>(`/api/clients/${ownerId}/lifecycles/${lifecycleId}`, input);
  return response.data;
}

export type ClientImportResult = { id: string; imported: number; updated: number; skipped: Array<{ row: number; reason: string }> };
export async function importClientTracker(file: File) {
  const body = new FormData(); body.append("file", file);
  const response = await api.post<ClientImportResult>("/api/clients/import", body);
  return response.data;
}

export async function getClientImportHistory() {
  const response = await api.get<ClientImportRun[]>("/api/clients/import-history");
  return response.data;
}
