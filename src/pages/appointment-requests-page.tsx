import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LoaderCircle, Search } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAppointmentRequests, runAppointmentOverdueSweep } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { AppointmentDetailDrawer } from "@/components/dashboard/appointment-detail-drawer";
import { AppointmentPriorityBadges } from "@/components/dashboard/appointment-priority-badges";
import { CalendarSyncBadge } from "@/components/dashboard/calendar-sync-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/auth/auth-context";
import {
  formatDateTime,
  formatPreferredSelections,
  formatRelativeTime,
  formatVisitType,
  isToday
} from "@/lib/format";
import { hasStalePendingReviewRequest } from "@/lib/appointment-state";
import { cn } from "@/lib/utils";
import type { AppointmentRequestListItem } from "@/types/api";
import { toast } from "sonner";

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

    if (tab === "scheduled") {
      return compareScheduled(left, right);
    }

    if (tab === "closed") {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }

    const leftState = getQueueState(left);
    const rightState = getQueueState(right);
    const stateRank = { overdue: 0, "needs-review": 1, scheduled: 2, closed: 3 };

    if (leftState !== rightState) return stateRank[leftState] - stateRank[rightState];
    if (leftState === "overdue") {
      const leftEnd = left.confirmedEndAt ? new Date(left.confirmedEndAt).getTime() : Number.POSITIVE_INFINITY;
      const rightEnd = right.confirmedEndAt ? new Date(right.confirmedEndAt).getTime() : Number.POSITIVE_INFINITY;
      if (leftEnd !== rightEnd) return leftEnd - rightEnd;
      if (leftUrgent !== rightUrgent) return leftUrgent ? -1 : 1;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }
    if (leftState === "needs-review") {
      if (leftUrgent !== rightUrgent) return leftUrgent ? -1 : 1;
      if (leftStale !== rightStale) return leftStale ? -1 : 1;
      if (leftDuplicate !== rightDuplicate) return leftDuplicate ? -1 : 1;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
    if (leftState === "scheduled") {
      return compareScheduled(left, right);
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  return sorted;
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
  const unsyncedCount = items.filter(
    (item) => item.status === "CONFIRMED" && item.calendarSyncStatus === "NOT_SYNCED"
  ).length;
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Queue"
        title="Appointment Requests"
        description="Review incoming appointment intake, confirm clinic-ready slots, and monitor calendar sync health from one operational workspace."
      />

      <div className="grid gap-4 xl:grid-cols-6">
        {[
          { label: "Overdue", value: overdueCount, tone: "danger" },
          { label: "Pending review", value: pendingCount, tone: "default" },
          { label: "Stale review", value: staleCount, tone: "warning" },
          { label: "Urgent", value: urgentCount, tone: "danger" },
          { label: "Possible duplicates", value: duplicateCount, tone: "warning" },
          { label: "Sync failures", value: failedSyncCount, tone: "danger" }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="py-5">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <Badge
                  variant={item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : item.tone === "success" ? "success" : "default"}
                >
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Queue controls</CardTitle>
            {user?.role === "ADMIN" ? (
              <Button
                variant="outline"
                onClick={() => overdueSweepMutation.mutate()}
                disabled={overdueSweepMutation.isPending}
              >
                {overdueSweepMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Running overdue sweep...
                  </>
                ) : (
                  "Run overdue sweep"
                )}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overdue", label: "Overdue" },
              { key: "needs-review", label: "Needs Review" },
              { key: "scheduled", label: "Scheduled" },
              { key: "closed", label: "Closed" },
              { key: "all", label: "All" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => updateUrl({ tab: tab.key })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  queueTab === tab.key
                    ? "border-primary/20 bg-primary text-primary-foreground"
                    : "border-border bg-white text-muted-foreground hover:bg-secondary"
                )}
              >
                {tab.label}{" "}
                <span className={cn("ml-1", queueTab === tab.key ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {tabCounts[tab.key as AppointmentQueueTab]}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-11"
                placeholder="Search by owner, pet, phone, or email"
              />
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => updateUrl({ dateFrom: event.target.value || null })}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => updateUrl({ dateTo: event.target.value || null })}
            />
            <Button
              variant="ghost"
              className="justify-self-start text-muted-foreground"
              onClick={() => {
                setSearchInput("");
                navigate({ pathname: appointmentId ? `/appointments/${appointmentId}` : "/appointments", search: "" }, { replace: true });
              }}
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "urgent", label: "Urgent only", active: urgentOnly },
              { key: "stale", label: "Requested slots passed", active: staleOnly },
              { key: "duplicate", label: "Possible duplicates", active: duplicateOnly },
              { key: "sync", label: "Sync issues", active: syncIssuesOnly },
              { key: "confirmedToday", label: "Confirmed today", active: confirmedTodayOnly }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateUrl({ [item.key]: item.active ? null : "1" })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  item.active
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border bg-white text-muted-foreground hover:bg-secondary"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Operational queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Intake review, scheduling, and sync follow-up stay in one list with URL-persisted state.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-secondary/80">
              {visibleItems.length} shown
            </Badge>
            {queueTab === "scheduled" ? (
              <CalendarSyncBadge
                status={failedSyncCount > 0 ? "FAILED" : unsyncedCount > 0 ? "NOT_SYNCED" : "SYNCED"}
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-2xl" />)
          ) : requestsQuery.isError ? (
            <ErrorState
              title="Could not load appointment requests"
              description={getErrorMessage(requestsQuery.error)}
              onRetry={() => requestsQuery.refetch()}
            />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              title="No appointment requests match this operational view"
              description="Try switching the queue tab, clearing the quick filters, or widening the date range."
              actionLabel="Clear queue filters"
              onAction={() => {
                setSearchInput("");
                navigate({ pathname: appointmentId ? `/appointments/${appointmentId}` : "/appointments", search: "" }, { replace: true });
              }}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-border">
                <div className="max-h-[860px] overflow-y-auto">
                  <div className="sticky top-0 z-10 hidden grid-cols-[1fr_1.35fr_1.2fr_0.95fr_1fr_0.65fr] gap-4 border-b border-border bg-secondary/95 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur xl:grid">
                    <div>Priority</div>
                    <div>Patient / Owner</div>
                    <div>Requested / Confirmed Time</div>
                    <div>Visit Type</div>
                    <div>Status / Sync</div>
                    <div>Review</div>
                  </div>
                  <div className="divide-y divide-border">
                    {visibleItems.map((item) => {
                      const urgent = isUrgentAppointment(item);
                      const stale = isStalePendingReview(item);
                      const syncIssue = hasCalendarIssue(item);
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
                          className="grid w-full gap-4 bg-white px-5 py-4 text-left transition hover:bg-secondary/30 focus-visible:bg-secondary/35 focus-visible:outline-none xl:grid-cols-[1fr_1.35fr_1.2fr_0.95fr_1fr_0.65fr]"
                        >
                          <div>
                            <AppointmentPriorityBadges
                              urgent={urgent}
                              stale={stale}
                              duplicate={item.possibleDuplicate}
                              syncIssue={syncIssue}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.pet.name}</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {item.owner.firstName} {item.owner.lastName}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.owner.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="line-clamp-2 text-sm font-medium text-foreground">
                              {timingLabel === "No preferences captured" ? "No preferred time captured" : timingLabel}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{timingMeta}</p>
                          </div>
                          <div className="text-sm text-foreground">{formatVisitType(item.visitType)}</div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge status={item.status} />
                              <CalendarSyncBadge status={item.calendarSyncStatus} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.status === "CONFIRMED" || item.status === "OVERDUE"
                                ? formatRelativeTime(item.confirmedEndAt ?? item.confirmedStartAt)
                                : formatRelativeTime(item.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2 xl:justify-end">
                            <span className="text-sm font-semibold text-primary">Review</span>
                            <ChevronRight className="h-4 w-4 text-primary" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {requestsQuery.hasNextPage ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => requestsQuery.fetchNextPage()}
                    disabled={requestsQuery.isFetchingNextPage}
                  >
                    {requestsQuery.isFetchingNextPage ? "Loading more..." : "Load more requests"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

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
