import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "@/api/http";
import { getNewPatientRequests } from "@/api/new-patients";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { NewPatientDetailDrawer } from "@/components/dashboard/new-patient-detail-drawer";
import { PageHeader } from "@/components/dashboard/page-header";
import { QueuePriorityBadges } from "@/components/dashboard/queue-priority-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatDateTime, formatRelativeTime, formatSpecies, isToday } from "@/lib/format";
import type { NewPatientRequest } from "@/types/api";

function sortQueue(items: NewPatientRequest[]) {
  return [...items].sort((left, right) => {
    if (left.isUrgent !== right.isUrgent) return left.isUrgent ? -1 : 1;
    if (left.possibleDuplicate !== right.possibleDuplicate) return left.possibleDuplicate ? -1 : 1;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function NewPatientRequestsPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [needsReviewToday, setNeedsReviewToday] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      dateFrom,
      dateTo,
      limit: 20
    }),
    [dateFrom, dateTo, debouncedSearch]
  );

  const requestsQuery = useInfiniteQuery({
    queryKey: ["new-patient-requests", filters],
    queryFn: ({ pageParam }) => getNewPatientRequests(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  const items = requestsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const sortedItems = useMemo(() => sortQueue(items), [items]);
  const visibleItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        if (urgentOnly && !item.isUrgent) return false;
        if (duplicateOnly && !item.possibleDuplicate) return false;
        if (needsReviewToday && !isToday(item.createdAt)) return false;
        return true;
      }),
    [duplicateOnly, needsReviewToday, sortedItems, urgentOnly]
  );
  const urgentCount = visibleItems.filter((item) => item.isUrgent).length;
  const duplicateCount = visibleItems.filter((item) => item.possibleDuplicate).length;
  const activeIndex = visibleItems.findIndex((item) => item.id === requestId);
  const previousRequestId = activeIndex > 0 ? visibleItems[activeIndex - 1]?.id : null;
  const nextRequestId =
    activeIndex >= 0 && activeIndex < visibleItems.length - 1 ? visibleItems[activeIndex + 1]?.id : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Intake"
        title="New Patient Requests"
        description="Review incoming new-patient intake, urgent flags, duplicate warnings, and attached documentation."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-11"
                placeholder="Search owner, pet, phone, or reason"
              />
            </div>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            <Button
              variant="ghost"
              className="justify-self-start text-muted-foreground"
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setUrgentOnly(false);
                setDuplicateOnly(false);
                setNeedsReviewToday(false);
              }}
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUrgentOnly((value) => !value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                urgentOnly
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-border bg-white text-muted-foreground hover:bg-secondary"
              )}
            >
              Urgent only
            </button>
            <button
              type="button"
              onClick={() => setDuplicateOnly((value) => !value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                duplicateOnly
                  ? "border-warning/25 bg-warning/10 text-warning"
                  : "border-border bg-white text-muted-foreground hover:bg-secondary"
              )}
            >
              Possible duplicates
            </button>
            <button
              type="button"
              onClick={() => setNeedsReviewToday((value) => !value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                needsReviewToday
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border bg-white text-muted-foreground hover:bg-secondary"
              )}
            >
              Needs review today
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Review queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Every item below comes directly from the protected intake endpoint.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-secondary/80">
              {visibleItems.length} shown
            </Badge>
            <Badge variant="danger">{urgentCount} urgent</Badge>
            <Badge variant="warning">{duplicateCount} duplicate</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
          ) : requestsQuery.isError ? (
            <ErrorState
              title="Could not load new patient requests"
              description={getErrorMessage(requestsQuery.error)}
              onRetry={() => requestsQuery.refetch()}
            />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              title="No new patient requests match these filters"
              description="Clear the search or widen the date range to repopulate the intake queue."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setUrgentOnly(false);
                setDuplicateOnly(false);
                setNeedsReviewToday(false);
              }}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-border">
                <div className="max-h-[860px] overflow-y-auto">
                  <div className="sticky top-0 z-10 hidden grid-cols-[0.9fr_1.35fr_1fr_1.3fr_0.9fr_0.7fr] gap-4 border-b border-border bg-secondary/95 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur xl:grid">
                    <div>Priority</div>
                    <div>Patient / Owner</div>
                    <div>Requested visit</div>
                    <div>Reason</div>
                    <div>Submitted</div>
                    <div>Open</div>
                  </div>
                  <div className="divide-y divide-border">
                    {visibleItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/new-patients/${item.id}`)}
                        className="grid w-full gap-4 bg-white px-5 py-4 text-left transition hover:bg-secondary/30 focus-visible:bg-secondary/35 focus-visible:outline-none xl:grid-cols-[0.9fr_1.35fr_1fr_1.3fr_0.9fr_0.7fr]"
                      >
                        <div>
                          <QueuePriorityBadges urgent={item.isUrgent} duplicate={item.possibleDuplicate} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{item.petName}</p>
                            <Badge variant="accent">{formatSpecies(item.species)}</Badge>
                          </div>
                          <p className="mt-1 text-sm font-medium text-foreground">{item.ownerFullName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.ownerPhoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item.preferredDateTime ? formatDateTime(item.preferredDateTime) : "No preferred time"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.timezone || "Timezone not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="line-clamp-2 text-sm leading-6 text-foreground" title={item.reasonForVisit}>
                            {item.reasonForVisit}
                          </p>
                        </div>
                        <div title={formatDateTime(item.createdAt)}>
                          <p className="text-sm font-medium text-foreground">{formatRelativeTime(item.createdAt)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 xl:justify-end">
                          <span className="text-sm font-semibold text-primary">Review</span>
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </div>
                      </button>
                    ))}
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

      <NewPatientDetailDrawer
        requestId={requestId ?? null}
        open={Boolean(requestId)}
        onClose={() => navigate("/new-patients")}
        onNavigatePrevious={previousRequestId ? () => navigate(`/new-patients/${previousRequestId}`) : undefined}
        onNavigateNext={nextRequestId ? () => navigate(`/new-patients/${nextRequestId}`) : undefined}
        canNavigatePrevious={Boolean(previousRequestId)}
        canNavigateNext={Boolean(nextRequestId)}
      />
    </div>
  );
}
