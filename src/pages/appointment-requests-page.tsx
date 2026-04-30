import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getAppointmentRequests } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { AppointmentDetailDrawer } from "@/components/dashboard/appointment-detail-drawer";
import { DuplicateBadge } from "@/components/dashboard/duplicate-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateOnly, formatPreferredSelections, formatVisitType } from "@/lib/format";
import type { AppointmentRequestStatus } from "@/types/api";

export function AppointmentRequestsPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentRequestStatus | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      status,
      dateFrom,
      dateTo,
      limit: 20
    }),
    [dateFrom, dateTo, debouncedSearch, status]
  );

  const requestsQuery = useInfiniteQuery({
    queryKey: ["appointment-requests", filters],
    queryFn: ({ pageParam }) => getAppointmentRequests(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  const items = requestsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Queue"
        title="Appointment Requests"
        description="Search, filter, and review submitted appointment intake. Status changes are written back to the live backend."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11"
              placeholder="Search by owner, pet, phone, or email"
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value as AppointmentRequestStatus | "ALL")}>
            <option value="ALL">All statuses</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No show</option>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("ALL");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Review queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Cursor-based live request loading with resilient empty and error states.</p>
          </div>
          <div className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            {items.length} shown
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
          ) : requestsQuery.isError ? (
            <ErrorState
              title="Could not load appointment requests"
              description={getErrorMessage(requestsQuery.error)}
              onRetry={() => requestsQuery.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No appointment requests match these filters"
              description="Try widening the date range, clearing the search, or switching back to all statuses."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch("");
                setStatus("ALL");
                setDateFrom("");
                setDateTo("");
              }}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-border">
                <div className="hidden grid-cols-[1.2fr_1.1fr_1fr_1fr_1fr_1fr_1fr] gap-4 bg-secondary/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground xl:grid">
                  <div>Pet</div>
                  <div>Owner</div>
                  <div>Phone</div>
                  <div>Visit type</div>
                  <div>Status</div>
                  <div>Duplicate</div>
                  <div>Created</div>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/appointments/${item.id}`)}
                      className="grid w-full gap-4 bg-white px-5 py-4 text-left transition hover:bg-secondary/30 xl:grid-cols-[1.2fr_1.1fr_1fr_1fr_1fr_1fr_1fr]"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{item.pet.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPreferredSelections(item.preferredSelections)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.owner.firstName} {item.owner.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.owner.email || "No email"}</p>
                      </div>
                      <div className="text-sm text-foreground">{item.owner.phoneNumber}</div>
                      <div className="text-sm text-foreground">{formatVisitType(item.visitType)}</div>
                      <div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div>
                        <DuplicateBadge duplicate={item.possibleDuplicate} urgent={item.visitType === "URGENT_CARE"} />
                      </div>
                      <div className="text-sm text-foreground">{formatDateOnly(item.createdAt)}</div>
                    </button>
                  ))}
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
        onClose={() => navigate("/appointments")}
      />
    </div>
  );
}
