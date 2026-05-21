import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  Globe2,
  Hourglass,
  LoaderCircle,
  MoreVertical,
  PawPrint,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Zap
} from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getAppointmentRequests, runAppointmentOverdueSweep } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { AppointmentDetailDrawer } from "@/components/dashboard/appointment-detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import heroOrangeCatIllustration from "@/assets/illustrations/hero-orange-cat-illustration.png";
import emptyFilesStateIllustration from "@/assets/illustrations/empty-files-state-illustration.png";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { hasStalePendingReviewRequest } from "@/lib/appointment-state";
import {
  formatDateTime,
  formatPreferredSelections,
  formatRelativeTime,
  formatStatus,
  formatVisitType,
  isToday
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppointmentRequestListItem, AppointmentRequestStatus, CalendarSyncStatus } from "@/types/api";

type AppointmentQueueTab = "overdue" | "needs-review" | "scheduled" | "closed" | "all";

const queueTabs: AppointmentQueueTab[] = ["overdue", "needs-review", "scheduled", "closed", "all"];
const closedStatuses = new Set(["CANCELLED", "COMPLETED", "NO_SHOW"]);

function parseQueueTab(value: string | null): AppointmentQueueTab {
  return queueTabs.includes(value as AppointmentQueueTab) ? (value as AppointmentQueueTab) : "needs-review";
}

function isUrgentAppointment(item: AppointmentRequestListItem) {
  return item.visitType === "URGENT_CARE";
}

function hasCalendarIssue(item: AppointmentRequestListItem) {
  return item.calendarSyncStatus === "FAILED";
}

function isConfirmedToday(item: AppointmentRequestListItem) {
  return item.status === "CONFIRMED" && isToday(item.confirmedStartAt);
}

function isStalePendingReview(item: AppointmentRequestListItem) {
  return hasStalePendingReviewRequest(item);
}

function getQueueState(item: AppointmentRequestListItem): Exclude<AppointmentQueueTab, "all"> {
  if (item.status === "OVERDUE") return "overdue";
  if (item.status === "PENDING_REVIEW") return "needs-review";
  if (item.status === "CONFIRMED") return "scheduled";
  return "closed";
}

function matchesQueueTab(item: AppointmentRequestListItem, tab: AppointmentQueueTab) {
  if (tab === "all") return true;
  return getQueueState(item) === tab;
}

function compareScheduled(left: AppointmentRequestListItem, right: AppointmentRequestListItem) {
  const leftRank = left.calendarSyncStatus === "FAILED" ? 0 : left.calendarSyncStatus === "NOT_SYNCED" ? 1 : 2;
  const rightRank = right.calendarSyncStatus === "FAILED" ? 0 : right.calendarSyncStatus === "NOT_SYNCED" ? 1 : 2;

  if (leftRank !== rightRank) return leftRank - rightRank;

  const leftStart = left.confirmedStartAt ? new Date(left.confirmedStartAt).getTime() : Number.POSITIVE_INFINITY;
  const rightStart = right.confirmedStartAt ? new Date(right.confirmedStartAt).getTime() : Number.POSITIVE_INFINITY;

  if (leftStart !== rightStart) return leftStart - rightStart;
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function sortAppointments(items: AppointmentRequestListItem[], tab: AppointmentQueueTab) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    const leftUrgent = isUrgentAppointment(left);
    const rightUrgent = isUrgentAppointment(right);
    const leftStale = isStalePendingReview(left);
    const rightStale = isStalePendingReview(right);
    const leftDuplicate = left.possibleDuplicate;
    const rightDuplicate = right.possibleDuplicate;

    if (tab === "overdue") {
      const leftEnd = left.confirmedEndAt ? new Date(left.confirmedEndAt).getTime() : Number.POSITIVE_INFINITY;
      const rightEnd = right.confirmedEndAt ? new Date(right.confirmedEndAt).getTime() : Number.POSITIVE_INFINITY;
      if (leftEnd !== rightEnd) return leftEnd - rightEnd;
      if (leftUrgent !== rightUrgent) return leftUrgent ? -1 : 1;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }

    if (tab === "needs-review") {
      if (leftUrgent !== rightUrgent) return leftUrgent ? -1 : 1;
      if (leftStale !== rightStale) return leftStale ? -1 : 1;
      if (leftDuplicate !== rightDuplicate) return leftDuplicate ? -1 : 1;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (tab === "scheduled") return compareScheduled(left, right);
    if (tab === "closed") return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

    const leftState = getQueueState(left);
    const rightState = getQueueState(right);
    const stateRank = { overdue: 0, "needs-review": 1, scheduled: 2, closed: 3 };

    if (leftState !== rightState) return stateRank[leftState] - stateRank[rightState];
    if (leftState === "scheduled") return compareScheduled(left, right);
    if (leftState === "closed") return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (leftUrgent !== rightUrgent) return leftUrgent ? -1 : 1;
    if (leftStale !== rightStale) return leftStale ? -1 : 1;
    if (leftDuplicate !== rightDuplicate) return leftDuplicate ? -1 : 1;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return sorted;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: "red" | "green" | "amber" | "blue" | "purple" | "pink";
}) {
  const tones = {
    red: "bg-[#FFE8E8] text-[#D93030]",
    green: "bg-[#EAF7F0] text-[#087C48]",
    amber: "bg-[#FFF3D9] text-[#A46600]",
    blue: "bg-[#EAF3FF] text-[#2673D9]",
    purple: "bg-[#F1E8FF] text-[#7B3FD6]",
    pink: "bg-[#FFEAF4] text-[#D93A85]"
  };

  return (
    <div className="min-h-[110px] rounded-[22px] border border-[rgba(221,235,226,0.88)] bg-[rgba(255,255,255,0.96)] p-[22px] shadow-soft-card">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", tones[tone])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold text-[#263D35]">{label}</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-[32px] font-black leading-none text-[#102E24]">{value}</p>
            <span className={cn("rounded-full px-2 py-1 text-[11px] font-extrabold", tones[tone])}>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  children,
  onClick,
  icon: Icon
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition",
        active
          ? "border-[#087C48] bg-[#087C48] text-white shadow-[0_10px_24px_rgba(8,124,72,0.18)]"
          : "border-[#DDEBE2] bg-white text-[#5F756C] hover:border-[#BFD8CA] hover:bg-[#F5FBF7] hover:text-[#087C48]"
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function PriorityPill({ item }: { item: AppointmentRequestListItem }) {
  const stale = isStalePendingReview(item);
  const urgent = isUrgentAppointment(item);
  const syncIssue = hasCalendarIssue(item);

  if (stale) {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#FFF3D9] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#A46600]">
        <Clock3 className="h-4 w-4" />
        Requested slots passed
      </span>
    );
  }

  if (item.status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#FFE8E8] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#D93030]">
        <Clock3 className="h-4 w-4" />
        Overdue
      </span>
    );
  }

  if (urgent) {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#EAF3FF] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#2673D9]">
        <ShieldAlert className="h-4 w-4" />
        Urgent
      </span>
    );
  }

  if (syncIssue) {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#FFEAF4] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#D93A85]">
        <RefreshCw className="h-4 w-4" />
        Sync issue
      </span>
    );
  }

  if (item.possibleDuplicate) {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#F1E8FF] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#7B3FD6]">
        <Copy className="h-4 w-4" />
        Possible duplicate
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#EAF7F0] px-3 py-2.5 text-xs font-black leading-[1.15] text-[#5F756C]">
      <Clock3 className="h-4 w-4" />
      Routine
    </span>
  );
}

function StatusPill({ status }: { status: AppointmentRequestStatus }) {
  const tone =
    status === "CONFIRMED" || status === "COMPLETED"
      ? "bg-[#DFF1E7] text-[#087C48]"
      : status === "PENDING_REVIEW"
        ? "bg-[#FFF3D9] text-[#A46600]"
        : "bg-[#FFE8E8] text-[#D93030]";

  return <span className={cn("inline-flex rounded-full px-[9px] py-[5px] text-[11px] font-black", tone)}>{formatStatus(status)}</span>;
}

function SyncPill({ status }: { status: CalendarSyncStatus }) {
  const config =
    status === "SYNCED"
      ? { label: "Synced", className: "bg-[#DFF1E7] text-[#087C48]" }
      : status === "FAILED"
        ? { label: "Sync failed", className: "bg-[#FFEAF4] text-[#D93A85]" }
        : { label: "Not synced", className: "bg-[#EAF7F0] text-[#5F756C]" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-[9px] py-[5px] text-[11px] font-extrabold", config.className)}>
      <RefreshCw className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function PetAvatar({ item }: { item: AppointmentRequestListItem }) {
  const isCat = item.pet.species === "CAT";

  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        isCat ? "bg-[#F1E8FF] text-[#7B3FD6]" : "bg-[#DFF1E7] text-[#087C48]"
      )}
    >
      <PawPrint className="h-5 w-5" />
    </span>
  );
}

export function AppointmentRequestsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const queueTab = parseQueueTab(searchParams.get("tab"));
  const searchValue = searchParams.get("search") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const urgentOnly = searchParams.get("urgent") === "1";
  const duplicateOnly = searchParams.get("duplicate") === "1";
  const staleOnly = searchParams.get("stale") === "1";
  const syncIssuesOnly = searchParams.get("sync") === "1";
  const confirmedTodayOnly = searchParams.get("confirmedToday") === "1";
  const [searchInput, setSearchInput] = useState(searchValue);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  function updateUrl(
    updates: Record<string, string | null>,
    options?: { appointmentId?: string | null; replace?: boolean }
  ) {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    const nextAppointmentId = options?.appointmentId === undefined ? appointmentId ?? null : options.appointmentId;
    navigate(
      {
        pathname: nextAppointmentId ? `/appointments/${nextAppointmentId}` : "/appointments",
        search: nextParams.toString() ? `?${nextParams.toString()}` : ""
      },
      { replace: options?.replace ?? true }
    );
  }

  useEffect(() => {
    if (debouncedSearch === searchValue) return;
    updateUrl({ search: debouncedSearch.trim() || null }, { replace: true });
  }, [debouncedSearch, searchValue]);

  const filters = useMemo(
    () => ({
      search: searchValue.trim(),
      dateFrom,
      dateTo,
      limit: 20
    }),
    [dateFrom, dateTo, searchValue]
  );

  const requestsQuery = useInfiniteQuery({
    queryKey: ["appointment-requests", filters],
    queryFn: ({ pageParam }) => getAppointmentRequests(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
  const overdueSweepMutation = useMutation({
    mutationFn: runAppointmentOverdueSweep,
    onSuccess: async ({ markedCount }) => {
      toast.success(
        markedCount > 0
          ? `${markedCount} appointment${markedCount === 1 ? "" : "s"} moved to overdue.`
          : "No confirmed appointments were overdue."
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
        appointmentId
          ? queryClient.invalidateQueries({ queryKey: ["appointment-request", appointmentId] })
          : Promise.resolve()
      ]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to run overdue sweep"));
    }
  });

  const items = requestsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const tabCounts = useMemo(
    () => ({
      overdue: items.filter((item) => item.status === "OVERDUE").length,
      "needs-review": items.filter((item) => item.status === "PENDING_REVIEW").length,
      scheduled: items.filter((item) => item.status === "CONFIRMED").length,
      closed: items.filter((item) => closedStatuses.has(item.status)).length,
      all: items.length
    }),
    [items]
  );
  const pendingCount = tabCounts["needs-review"];
  const overdueCount = tabCounts.overdue;
  const urgentCount = items.filter((item) => isUrgentAppointment(item)).length;
  const staleCount = items.filter((item) => isStalePendingReview(item)).length;
  const duplicateCount = items.filter((item) => item.possibleDuplicate).length;
  const failedSyncCount = items.filter((item) => hasCalendarIssue(item)).length;
  const confirmedTodayCount = items.filter((item) => isConfirmedToday(item)).length;
  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!matchesQueueTab(item, queueTab)) return false;
      if (urgentOnly && !isUrgentAppointment(item)) return false;
      if (staleOnly && !isStalePendingReview(item)) return false;
      if (duplicateOnly && !item.possibleDuplicate) return false;
      if (syncIssuesOnly && !hasCalendarIssue(item)) return false;
      if (confirmedTodayOnly && !isConfirmedToday(item)) return false;
      return true;
    });

    return sortAppointments(filtered, queueTab);
  }, [confirmedTodayOnly, duplicateOnly, items, queueTab, staleOnly, syncIssuesOnly, urgentOnly]);
  const activeIndex = visibleItems.findIndex((item) => item.id === appointmentId);
  const previousAppointmentId = activeIndex > 0 ? visibleItems[activeIndex - 1]?.id : null;
  const nextAppointmentId =
    activeIndex >= 0 && activeIndex < visibleItems.length - 1 ? visibleItems[activeIndex + 1]?.id : null;

  return (
    <div className="space-y-6">
      <section className="relative min-h-[190px] overflow-hidden rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,252,248,0.96))] px-10 py-[34px] shadow-large-card before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/85">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(214,245,229,0.72),transparent_30%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#087C48]">Queue</p>
            <h1 className="mt-3 text-[42px] font-black leading-[1.02] tracking-[-0.045em] text-[#102E24] md:text-5xl">
              Appointment Requests
            </h1>
            <p className="mt-4 max-w-[640px] text-[15px] font-medium leading-[1.75] text-[#5F756C]">
              Review incoming appointment intake, confirm clinic-ready slots, and monitor calendar sync health from one
              operational workspace.
            </p>
          </div>
          <img
            src={heroOrangeCatIllustration}
            alt=""
            aria-hidden="true"
            className="hidden w-full max-w-[320px] justify-self-end object-contain lg:block"
          />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Overdue" value={overdueCount} icon={Clock3} tone="red" />
        <MetricCard label="Pending review" value={pendingCount} icon={FileText} tone="green" />
        <MetricCard label="Stale review" value={staleCount} icon={Hourglass} tone="amber" />
        <MetricCard label="Urgent" value={urgentCount} icon={BellRing} tone="blue" />
        <MetricCard label="Possible duplicates" value={duplicateCount} icon={Copy} tone="purple" />
        <MetricCard label="Sync failures" value={failedSyncCount} icon={RefreshCw} tone="pink" />
      </section>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-[26px] shadow-[0_22px_60px_rgba(15,64,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.03em] text-[#102E24]">Queue controls</h2>
          {user?.role === "ADMIN" ? (
            <Button
              variant="outline"
              onClick={() => overdueSweepMutation.mutate()}
              disabled={overdueSweepMutation.isPending}
              className="h-12 rounded-2xl border-[#DDEBE2] px-5 font-bold text-[#087C48] shadow-[0_8px_18px_rgba(15,64,42,0.04)]"
            >
              {overdueSweepMutation.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Running overdue sweep...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run overdue sweep
                </>
              )}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {[
            { key: "overdue", label: "Overdue" },
            { key: "needs-review", label: "Needs Review" },
            { key: "scheduled", label: "Scheduled" },
            { key: "closed", label: "Closed" },
            { key: "all", label: "All" }
          ].map((tab) => (
            <FilterPill
              key={tab.key}
              active={queueTab === tab.key}
              onClick={() => updateUrl({ tab: tab.key })}
            >
              {tab.label} {tabCounts[tab.key as AppointmentQueueTab]}
            </FilterPill>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_0.85fr_0.85fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F756C]" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-12 rounded-2xl border-[#DDEBE2] bg-white pl-12 font-semibold text-[#102E24] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] placeholder:text-[#829A91]"
              placeholder="Search by owner, pet, phone, or email"
            />
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => updateUrl({ dateFrom: event.target.value || null })}
            className="h-12 rounded-2xl border-[#DDEBE2] bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => updateUrl({ dateTo: event.target.value || null })}
            className="h-12 rounded-2xl border-[#DDEBE2] bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          />
          <Button
            variant="ghost"
            className="h-12 justify-self-start rounded-2xl px-5 font-extrabold text-[#087C48]"
            onClick={() => {
              setSearchInput("");
              navigate({ pathname: appointmentId ? `/appointments/${appointmentId}` : "/appointments", search: "" }, { replace: true });
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <FilterPill active={urgentOnly} icon={AlertTriangle} onClick={() => updateUrl({ urgent: urgentOnly ? null : "1" })}>
            Urgent only
          </FilterPill>
          <FilterPill active={staleOnly} icon={Clock3} onClick={() => updateUrl({ stale: staleOnly ? null : "1" })}>
            Requested slots passed
          </FilterPill>
          <FilterPill active={duplicateOnly} icon={Copy} onClick={() => updateUrl({ duplicate: duplicateOnly ? null : "1" })}>
            Possible duplicates
          </FilterPill>
          <FilterPill active={syncIssuesOnly} icon={RefreshCw} onClick={() => updateUrl({ sync: syncIssuesOnly ? null : "1" })}>
            Sync issues
          </FilterPill>
          <FilterPill
            active={confirmedTodayOnly}
            icon={CalendarDays}
            onClick={() => updateUrl({ confirmedToday: confirmedTodayOnly ? null : "1" })}
          >
            Confirmed today {confirmedTodayCount}
          </FilterPill>
        </div>
      </section>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-[26px] shadow-[0_24px_70px_rgba(15,64,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-[#102E24]">Operational queue</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#5F756C]">
              Intake review, scheduling, and sync follow-up stay in one list with URL-persisted state.
            </p>
          </div>
          <span className="rounded-full bg-[#EAF7F0] px-4 py-2 text-sm font-extrabold text-[#5F756C]">
            {visibleItems.length} shown
          </span>
        </div>

        <div className="mt-5">
          {requestsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : requestsQuery.isError ? (
            <div className="rounded-[24px] border border-[#DDEBE2] bg-[#FAFCFA] p-8">
              <p className="text-lg font-black text-[#102E24]">Could not load appointment requests</p>
              <p className="mt-2 text-sm text-[#5F756C]">{getErrorMessage(requestsQuery.error)}</p>
              <Button className="mt-4" onClick={() => requestsQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DDEBE2] bg-[#FAFCFA] px-6 py-12 text-center">
              <img src={emptyFilesStateIllustration} alt="" aria-hidden="true" className="w-40" />
              <h3 className="mt-4 text-xl font-black text-[#102E24]">No appointment requests found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5F756C]">
                Try clearing filters or checking another queue.
              </p>
              <Button
                variant="outline"
                className="mt-5 rounded-2xl border-[#DDEBE2]"
                onClick={() => {
                  setSearchInput("");
                  navigate({ pathname: appointmentId ? `/appointments/${appointmentId}` : "/appointments", search: "" }, { replace: true });
                }}
              >
                Clear queue filters
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[20px] border border-[#DDEBE2]">
                <div className="max-h-[860px] overflow-y-auto">
                  <div className="sticky top-0 z-10 hidden min-h-[54px] grid-cols-[1.15fr_1.55fr_1.45fr_1fr_1.25fr_0.75fr] items-center gap-4 border-b border-[#DDEBE2] bg-[#EAF7F0] px-5 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#6F8F82] backdrop-blur xl:grid">
                    <div>Priority</div>
                    <div>Patient / Owner</div>
                    <div>Requested / Confirmed Time</div>
                    <div>Visit Type</div>
                    <div>Status / Sync</div>
                    <div>Review</div>
                  </div>
                  <div className="divide-y divide-[#E8F0EB]">
                    {visibleItems.map((item) => {
                      const timingLabel =
                        (item.status === "CONFIRMED" || item.status === "OVERDUE") && item.confirmedStartAt
                          ? formatDateTime(item.confirmedStartAt)
                          : formatPreferredSelections(item.preferredSelections);
                      const timingMeta =
                        item.status === "CONFIRMED" || item.status === "OVERDUE"
                          ? item.confirmedTimezone || item.timezone || "Timezone not provided"
                          : item.timezone || "Timezone not provided";

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            navigate({
                              pathname: `/appointments/${item.id}`,
                              search: location.search
                            })
                          }
                          className="group grid min-h-[94px] w-full gap-4 bg-white px-5 py-5 text-left transition hover:bg-[#FAFCFA] focus-visible:bg-[#F5FBF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087C48] xl:grid-cols-[1.15fr_1.55fr_1.45fr_1fr_1.25fr_0.75fr]"
                        >
                          <div className="flex items-start">
                            <PriorityPill item={item} />
                          </div>
                          <div className="flex min-w-0 items-start gap-3">
                            <PetAvatar item={item} />
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-black text-[#102E24]">{item.pet.name}</p>
                              <p className="mt-1 truncate text-[13px] font-semibold text-[#587267]">
                                {item.owner.firstName} {item.owner.lastName}
                              </p>
                              <p className="mt-1 text-[13px] font-semibold text-[#587267]">{item.owner.phoneNumber}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-extrabold leading-6 text-[#102E24]">
                              {timingLabel === "No preferences captured" ? "No preferred time captured" : timingLabel}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-[#6D8279]">
                              <Globe2 className="h-4 w-4" />
                              {timingMeta}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#102E24]">
                            <Stethoscope className="h-5 w-5 text-[#7B3FD6]" />
                            {formatVisitType(item.visitType)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill status={item.status} />
                              <SyncPill status={item.calendarSyncStatus} />
                            </div>
                            <p className="text-sm font-medium text-[#5F756C]">
                              {item.status === "CONFIRMED" || item.status === "OVERDUE"
                                ? formatRelativeTime(item.confirmedEndAt ?? item.confirmedStartAt)
                                : formatRelativeTime(item.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2 xl:justify-end">
                            <span className="inline-flex items-center gap-2 text-sm font-black text-[#087C48] transition group-hover:translate-x-0.5 group-hover:underline">
                              Review
                              <ChevronRight className="h-4 w-4" />
                            </span>
                            <MoreVertical className="h-5 w-5 text-[#5F756C]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {requestsQuery.hasNextPage ? (
                <div className="flex justify-center pt-5">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-[#DDEBE2]"
                    onClick={() => requestsQuery.fetchNextPage()}
                    disabled={requestsQuery.isFetchingNextPage}
                  >
                    {requestsQuery.isFetchingNextPage ? "Loading more..." : "Load more requests"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <AppointmentDetailDrawer
        appointmentId={appointmentId ?? null}
        open={Boolean(appointmentId)}
        onClose={() =>
          navigate({
            pathname: "/appointments",
            search: location.search
          })
        }
        onNavigatePrevious={
          previousAppointmentId
            ? () =>
                navigate({
                  pathname: `/appointments/${previousAppointmentId}`,
                  search: location.search
                })
            : undefined
        }
        onNavigateNext={
          nextAppointmentId
            ? () =>
                navigate({
                  pathname: `/appointments/${nextAppointmentId}`,
                  search: location.search
                })
            : undefined
        }
        canNavigatePrevious={Boolean(previousAppointmentId)}
        canNavigateNext={Boolean(nextAppointmentId)}
        onOpenReplacement={(nextId) =>
          navigate({
            pathname: `/appointments/${nextId}`,
            search: location.search
          })
        }
      />
    </div>
  );
}
