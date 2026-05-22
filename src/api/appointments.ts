import { api } from "@/api/http";
import { toDateTimeRange } from "@/lib/format";
import type {
  AppointmentListFilters,
  AppointmentPreferredSelection,
  AppointmentRequestDetail,
  AppointmentRequestListItem,
  AppointmentRequestStatus,
  CursorListResponse,
  RawAppointmentBase,
  RawAppointmentDetail
} from "@/types/api";

function groupPreferredSlots(preferredSlots: string[] | null | undefined): AppointmentPreferredSelection[] {
  if (!preferredSlots?.length) return [];

  const grouped = new Map<string, string[]>();

  for (const slot of preferredSlots) {
    const date = new Date(slot);
    if (Number.isNaN(date.getTime())) continue;

    const dayKey = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);

    const current = grouped.get(dayKey) ?? [];
    current.push(label);
    grouped.set(dayKey, current);
  }

  return Array.from(grouped.entries()).map(([date, timeSlots]) => ({ date, timeSlots }));
}

function normalizeAppointment(record: RawAppointmentDetail): AppointmentRequestDetail;
function normalizeAppointment(record: RawAppointmentBase): AppointmentRequestListItem;
function normalizeAppointment(record: RawAppointmentBase | RawAppointmentDetail) {
  const preferredSelections =
    record.preferredSelections?.length
      ? record.preferredSelections
      : groupPreferredSlots(record.preferredSlots);

  return {
    ...record,
    files: record.files ?? [],
    preferredSelections
  };
}

export async function getAppointmentRequests(filters: AppointmentListFilters, cursor?: string | null) {
  const response = await api.get<CursorListResponse<RawAppointmentBase>>("/api/appointment-requests", {
    params: {
      cursor: cursor ?? undefined,
      limit: filters.limit ?? 25,
      search: filters.search || undefined,
      status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
      dateFrom: toDateTimeRange(filters.dateFrom),
      dateTo: toDateTimeRange(filters.dateTo, true)
    }
  });

  return {
    data: response.data.data.map((item) => normalizeAppointment(item)),
    nextCursor: response.data.nextCursor
  };
}

export async function getAppointmentRequest(id: string) {
  const response = await api.get<RawAppointmentDetail>(`/api/appointment-requests/${id}`);
  return normalizeAppointment(response.data);
}

export async function updateAppointmentStatus(
  id: string,
  input: {
    status: AppointmentRequestStatus;
    confirmedStartAt?: string;
    confirmedEndAt?: string;
    confirmedTimezone?: string;
  }
) {
  const response = await api.patch<RawAppointmentDetail>(`/api/appointment-requests/${id}/status`, input);
  return normalizeAppointment(response.data);
}

export async function retryAppointmentCalendarSync(id: string) {
  const response = await api.post<RawAppointmentDetail>(`/api/appointment-requests/${id}/calendar-sync`);
  return normalizeAppointment(response.data);
}

export async function sendAppointmentRescheduleLink(id: string, responseDeadline: string) {
  const response = await api.post<RawAppointmentDetail>(`/api/appointment-requests/${id}/reschedule-link`, {
    responseDeadline
  });
  return normalizeAppointment(response.data);
}

export async function runAppointmentOverdueSweep() {
  const response = await api.post<{ markedCount: number }>("/api/appointment-requests/mark-overdue");
  return response.data;
}
