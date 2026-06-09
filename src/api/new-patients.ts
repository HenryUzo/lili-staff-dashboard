import { api } from "@/api/http";
import { toDateTimeRange } from "@/lib/format";
import type { CursorListResponse, NewPatientListFilters, NewPatientRequest } from "@/types/api";

export async function getNewPatientRequests(filters: NewPatientListFilters, cursor?: string | null) {
  const response = await api.get<CursorListResponse<NewPatientRequest>>("/api/new-patient-requests", {
    params: {
      cursor: cursor ?? undefined,
      limit: filters.limit ?? 25,
      search: filters.search || undefined,
      referralSource:
        filters.referralSource && filters.referralSource !== "ALL"
          ? filters.referralSource
          : undefined,
      dateFrom: toDateTimeRange(filters.dateFrom),
      dateTo: toDateTimeRange(filters.dateTo, true)
    }
  });

  return response.data;
}

export async function getNewPatientRequest(id: string) {
  const response = await api.get<NewPatientRequest>(`/api/new-patient-requests/${id}`);
  return response.data;
}
