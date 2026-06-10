import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type {
  CalendarSyncStatus,
  AppointmentPreferredSelection,
  AppointmentRequestStatus,
  NewPatientReferralSource,
  PetSpecies,
  UploadedFile
} from "@/types/api";

function parseDate(dateString: string) {
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

export function formatDateTime(dateString?: string | null, fallback = "Not provided") {
  if (!dateString) return fallback;
  const date = parseDate(dateString);
  if (!date) return fallback;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function toDateTimeLocalValue(dateString?: string | null) {
  if (!dateString) return "";
  const date = parseDate(dateString);
  if (!date) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatDateOnly(dateString?: string | null, fallback = "Not provided") {
  if (!dateString) return fallback;
  const date = parseDate(dateString);
  if (!date) return fallback;
  return format(date, "MMM d, yyyy");
}

export function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "Unknown";
  const date = parseDate(dateString);
  if (!date) return "Unknown";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function isToday(dateString?: string | null) {
  if (!dateString) return false;
  const date = parseDate(dateString);
  if (!date) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function formatStatus(status: AppointmentRequestStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCalendarSyncStatus(status: CalendarSyncStatus) {
  return status === "SYNCED" ? "Synced" : status === "FAILED" ? "Failed" : "Not synced";
}

export function formatVisitType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatSpecies(species: PetSpecies) {
  return species === "DOG" ? "Dog" : "Cat";
}

export function formatNewPatientReferralSource(
  source?: NewPatientReferralSource | "NOT_CAPTURED" | null,
  fallback = "Not captured"
) {
  if (!source || source === "NOT_CAPTURED") {
    return fallback;
  }

  return source
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatNewPatientReferralSummary(
  source?: NewPatientReferralSource | "NOT_CAPTURED" | null,
  otherText?: string | null,
  fallback = "Not captured"
) {
  const label = formatNewPatientReferralSource(source, fallback);

  if (source === "OTHER" && otherText?.trim()) {
    return `${label} - ${otherText.trim()}`;
  }

  return label;
}

export function formatPreferredSelections(selections: AppointmentPreferredSelection[]) {
  if (selections.length === 0) return "No preferences captured";
  return selections
    .map((selection) => {
      const heading = formatDateOnly(selection.date, selection.date);
      return `${heading}: ${selection.timeSlots.join(", ")}`;
    })
    .join(" | ");
}

export function getFileKind(file: UploadedFile) {
  if (file.mimeType.startsWith("image/")) return "image";
  if (file.mimeType === "application/pdf") return "pdf";
  return "file";
}

export function toDateTimeRange(date?: string, endOfDay = false) {
  if (!date) return undefined;
  return endOfDay ? `${date}T23:59:59.999Z` : `${date}T00:00:00.000Z`;
}
