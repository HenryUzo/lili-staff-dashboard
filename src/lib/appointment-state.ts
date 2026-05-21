import type { AppointmentPreferredSelection, AppointmentRequestStatus } from "@/types/api";

type AppointmentWithPreferences = {
  status: AppointmentRequestStatus;
  timezone: string | null;
  preferredSelections: AppointmentPreferredSelection[];
};

function parseDateTimeInputParts(value: string) {
  const match = value.match(
    /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2})$/
  );

  if (!match?.groups) {
    return null;
  }

  return {
    year: Number(match.groups.year),
    month: Number(match.groups.month),
    day: Number(match.groups.day),
    hour: Number(match.groups.hour),
    minute: Number(match.groups.minute)
  };
}

function getSafeTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return "Africa/Lagos";
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const effectiveTimeZone = getSafeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: effectiveTimeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const asUtcTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtcTime - date.getTime();
}

function toUtcIsoFromTimeZone(value: string, timeZone: string) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return null;
  }

  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  );
  let offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let zonedDate = new Date(utcGuess.getTime() - offset);
  const correctedOffset = getTimeZoneOffsetMs(zonedDate, timeZone);

  if (correctedOffset !== offset) {
    offset = correctedOffset;
    zonedDate = new Date(utcGuess.getTime() - offset);
  }

  return zonedDate.toISOString();
}

export function normalizeSelectionDateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

export function getPreferredSelectionInstant(date: string, timeSlot: string, timeZone: string) {
  const normalizedTime = timeSlot.trim();
  const normalizedDate = normalizeSelectionDateKey(date);
  const effectiveTimeZone = getSafeTimeZone(timeZone);

  if (!normalizedDate || !/^\d{1,2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(":");
  const localValue = `${normalizedDate}T${hours.padStart(2, "0")}:${minutes}`;
  const isoValue = toUtcIsoFromTimeZone(localValue, effectiveTimeZone);

  if (!isoValue) {
    return null;
  }

  const instant = new Date(isoValue);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

export function isPastPreferredSelection(
  date: string,
  timeSlot: string,
  timeZone: string,
  now = new Date()
) {
  const instant = getPreferredSelectionInstant(date, timeSlot, timeZone);
  return Boolean(instant && instant.getTime() <= now.getTime());
}

export function hasAnyFuturePreferredSelection({
  preferredSelections,
  timezone
}: Pick<AppointmentWithPreferences, "preferredSelections" | "timezone">) {
  const effectiveTimeZone = timezone || "Africa/Lagos";

  return preferredSelections.some((selection) =>
    selection.timeSlots.some((timeSlot) => !isPastPreferredSelection(selection.date, timeSlot, effectiveTimeZone))
  );
}

export function getLatestPreferredSelectionAt({
  preferredSelections,
  timezone
}: Pick<AppointmentWithPreferences, "preferredSelections" | "timezone">) {
  const effectiveTimeZone = timezone || "Africa/Lagos";
  let latest: Date | null = null;

  for (const selection of preferredSelections) {
    for (const timeSlot of selection.timeSlots) {
      const instant = getPreferredSelectionInstant(selection.date, timeSlot, effectiveTimeZone);

      if (!instant) {
        continue;
      }

      if (!latest || instant.getTime() > latest.getTime()) {
        latest = instant;
      }
    }
  }

  return latest;
}

export function hasStalePendingReviewRequest(item: AppointmentWithPreferences) {
  if (item.status !== "PENDING_REVIEW") {
    return false;
  }

  if (!hasAnyFuturePreferredSelection(item)) {
    const latestPreferredSelection = getLatestPreferredSelectionAt(item);
    return Boolean(latestPreferredSelection && latestPreferredSelection.getTime() < Date.now());
  }

  return false;
}

export function hasPastConfirmedStart(value?: string | null) {
  if (!value) {
    return false;
  }

  const instant = new Date(value);
  return !Number.isNaN(instant.getTime()) && instant.getTime() <= Date.now();
}
