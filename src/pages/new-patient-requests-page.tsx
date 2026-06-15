import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  FolderOpen,
  PawPrint,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp
} from "lucide-react";
import type { ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import newPatientHeroIntake from "@/assets/illustrations/new-patient-hero-intake.png";
import { getErrorMessage } from "@/api/http";
import { getNewPatientRequests } from "@/api/new-patients";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { NewPatientDetailDrawer } from "@/components/dashboard/new-patient-detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  formatDateTime,
  formatNewPatientReferralSummary,
  formatNewPatientReferralSource,
  formatRelativeTime,
  formatSpecies,
  isToday
} from "@/lib/format";
import type { NewPatientRequest, NewPatientReferralSource } from "@/types/api";

type IconComponent = ComponentType<{ className?: string }>;

const kpiStyles = {
  green: {
    icon: "bg-[#EAF7F0] text-[#087C48]",
    pill: "bg-[#EAF7F0] text-[#087C48]"
  },
  danger: {
    icon: "bg-[#FFE8E8] text-[#D93030]",
    pill: "bg-[#FFE8E8] text-[#D93030]"
  },
  purple: {
    icon: "bg-[#F1E8FF] text-[#7B3FD6]",
    pill: "bg-[#F1E8FF] text-[#7B3FD6]"
  },
  blue: {
    icon: "bg-[#EAF3FF] text-[#2673D9]",
    pill: "bg-[#EAF3FF] text-[#2673D9]"
  }
} as const;

type KpiTone = keyof typeof kpiStyles;

function sortQueue(items: NewPatientRequest[]) {
  return [...items].sort((left, right) => {
    if (left.isUrgent !== right.isUrgent) return left.isUrgent ? -1 : 1;
    if (left.possibleDuplicate !== right.possibleDuplicate) return left.possibleDuplicate ? -1 : 1;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function NewPatientHero() {
  return (
    <section className="relative grid min-h-[172px] overflow-hidden rounded-[26px] border border-[rgba(221,235,226,0.92)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,252,248,0.96))] px-8 py-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,330px)] lg:items-center lg:gap-8">
      <div className="pointer-events-none absolute right-4 top-1/2 hidden h-[220px] w-[380px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,238,217,0.62),transparent_64%)] lg:block" />
      <div className="relative z-10 max-w-[620px]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#087C48]">Intake</p>
        <h1 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#102E24] sm:text-[40px]">
          New Patient Requests
        </h1>
        <p className="mt-4 max-w-[620px] text-[14px] font-medium leading-[1.6] text-[#5F756C]">
          Review new-patient intake, identify urgent cases, catch duplicate submissions, and prepare clean patient
          records for the clinic team.
        </p>
      </div>
      <div className="relative z-10 mt-6 flex min-h-[130px] items-center justify-end lg:mt-0">
        <img
          src={newPatientHeroIntake}
          alt=""
          aria-hidden="true"
          className="h-auto w-full max-w-[300px] object-contain object-center lg:max-w-[330px]"
        />
      </div>
    </section>
  );
}

function KpiCard({
  title,
  value,
  helper,
  trend,
  icon: Icon,
  tone
}: {
  title: string;
  value: number;
  helper: string;
  trend: string;
  icon: IconComponent;
  tone: KpiTone;
}) {
  const styles = kpiStyles[tone];

  return (
    <article className="min-h-[160px] rounded-[22px] border border-[rgba(221,235,226,0.88)] bg-[rgba(255,255,255,0.96)] p-6 transition duration-180 hover:-translate-y-0.5">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-5 flex items-end gap-3">
        <p className="text-[36px] font-extrabold leading-none tracking-[-0.035em] text-[#102E24]">{value}</p>
        <TrendingUp className="mb-1 h-5 w-5 text-[#087C48]" />
      </div>
      <h2 className="mt-4 text-[13px] font-bold text-[#263D35]">{title}</h2>
      <p className="mt-2 text-[13px] font-medium leading-[1.6] text-[#5F756C]">{helper}</p>
      <span className={cn("mt-5 inline-flex rounded-full px-2 py-1.5 text-[11px] font-bold leading-none", styles.pill)}>
        {trend}
      </span>
    </article>
  );
}

function FilterChip({
  active,
  children,
  onClick,
  icon: Icon,
  tone = "green"
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  icon: IconComponent;
  tone?: "green" | "danger" | "warning";
}) {
  const activeClass =
    tone === "danger"
      ? "border-[#FFE8E8] bg-[#D93030] text-white"
      : tone === "warning"
        ? "border-[#FFF3D9] bg-[#A46600] text-white"
        : "border-[#087C48] bg-[#087C48] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition duration-180 hover:-translate-y-px",
        active ? activeClass : "border-[#DDEBE2] bg-white text-[#102E24] hover:bg-[#F5FBF7]"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SmallPill({ children, tone = "green" }: { children: string; tone?: KpiTone | "warning" }) {
  const className =
    tone === "warning"
      ? "bg-[#FFF3D9] text-[#A46600]"
      : tone === "danger"
        ? "bg-[#FFE8E8] text-[#D93030]"
        : tone === "purple"
          ? "bg-[#F1E8FF] text-[#7B3FD6]"
          : tone === "blue"
            ? "bg-[#EAF3FF] text-[#2673D9]"
            : "bg-[#EAF7F0] text-[#2F7D5A]";

  return <span className={cn("inline-flex rounded-full px-2 py-1.5 text-[11px] font-bold leading-none", className)}>{children}</span>;
}

function PriorityChips({ urgent, duplicate }: { urgent: boolean; duplicate: boolean }) {
  if (!urgent && !duplicate) {
    return <SmallPill>Routine</SmallPill>;
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {urgent ? <SmallPill tone="danger">Urgent</SmallPill> : null}
      {duplicate ? <SmallPill tone="warning">Possible duplicate</SmallPill> : null}
    </div>
  );
}

function PetAvatar({ index, urgent }: { index: number; urgent?: boolean }) {
  const tones = [
    "bg-[#EAF7F0] text-[#087C48]",
    "bg-[#FFF3D9] text-[#A46600]",
    "bg-[#F1E8FF] text-[#7B3FD6]",
    "bg-[#EAF3FF] text-[#2673D9]"
  ];

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
        urgent ? "bg-[#FFE8E8] text-[#D93030]" : tones[index % tones.length]
      )}
    >
      <PawPrint className="h-5 w-5" />
    </div>
  );
}

function NewPatientRow({ item, index, onOpen }: { item: NewPatientRequest; index: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full gap-4 bg-white px-5 py-4 text-left transition duration-180 hover:-translate-y-px hover:bg-[#FAFCFA] focus-visible:bg-[#FAFCFA] focus-visible:outline-none xl:grid-cols-[0.8fr_1.3fr_1.05fr_1.15fr_1.2fr_0.95fr_0.65fr]"
    >
      <div>
        <PriorityChips urgent={item.isUrgent} duplicate={item.possibleDuplicate} />
      </div>
      <div className="flex items-start gap-3">
        <PetAvatar index={index} urgent={item.isUrgent} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-[750] tracking-[-0.01em] text-[#102E24]">{item.petName}</p>
            <SmallPill>{formatSpecies(item.species)}</SmallPill>
          </div>
          <p className="mt-1 text-[13px] font-medium leading-[1.45] text-[#5F756C]">{item.ownerFullName}</p>
          <p className="mt-1 text-[13px] font-medium leading-[1.45] text-[#5F756C]">{item.ownerPhoneNumber}</p>
        </div>
      </div>
      <div title={formatNewPatientReferralSummary(item.referralSource, item.referralSourceOther)}>
        <p className="text-sm font-bold leading-6 text-[#102E24]">
          {formatNewPatientReferralSource(item.referralSource)}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-[1.45] text-[#5F756C]">
          {item.referralSource === "OTHER" && item.referralSourceOther
            ? item.referralSourceOther
            : item.referralSourceCapturedAt
              ? `Captured ${formatRelativeTime(item.referralSourceCapturedAt)}`
              : "Waiting on referral source"}
        </p>
      </div>
      <div>
        <p className="text-sm font-bold leading-6 text-[#102E24]">
          {item.preferredDateTime ? formatDateTime(item.preferredDateTime) : "No preferred time"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium leading-[1.45] text-[#5F756C]">
          <CalendarDays className="h-3.5 w-3.5" />
          {item.timezone || "Timezone not provided"}
        </p>
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#102E24]" title={item.reasonForVisit}>
        {item.reasonForVisit}
      </p>
      <div title={formatDateTime(item.createdAt)}>
        <p className="text-sm font-bold leading-6 text-[#102E24]">{formatRelativeTime(item.createdAt)}</p>
        <p className="mt-1 text-[13px] font-medium leading-[1.45] text-[#5F756C]">{formatDateTime(item.createdAt)}</p>
      </div>
      <div className="flex items-center justify-between gap-2 xl:justify-end">
        <span className="text-sm font-bold tracking-[-0.01em] text-[#087C48]">Review</span>
        <ChevronRight className="h-4 w-4 text-[#087C48] transition group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function GuidelineItem({
  icon: Icon,
  title,
  text,
  tone
}: {
  icon: IconComponent;
  title: string;
  text: string;
  tone: KpiTone;
}) {
  const styles = kpiStyles[tone];

  return (
    <div className="flex gap-4 border-[#DDEBE2] py-3 lg:border-l lg:first:border-l-0 lg:pl-8 lg:first:pl-0">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-[750] tracking-[-0.01em] text-[#102E24]">{title}</h3>
        <p className="mt-1 max-w-[230px] text-[13px] font-medium leading-6 text-[#5F756C]">{text}</p>
      </div>
    </div>
  );
}

export function NewPatientRequestsPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [referralSource, setReferralSource] = useState<NewPatientReferralSource | "NOT_CAPTURED" | "ALL">("ALL");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [needsReviewToday, setNeedsReviewToday] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      dateFrom,
      dateTo,
      referralSource,
      limit: 20
    }),
    [dateFrom, dateTo, debouncedSearch, referralSource]
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
  const urgentTotal = items.filter((item) => item.isUrgent).length;
  const duplicateTotal = items.filter((item) => item.possibleDuplicate).length;
  const urgentCount = visibleItems.filter((item) => item.isUrgent).length;
  const duplicateCount = visibleItems.filter((item) => item.possibleDuplicate).length;
  const activeIndex = visibleItems.findIndex((item) => item.id === requestId);
  const previousRequestId = activeIndex > 0 ? visibleItems[activeIndex - 1]?.id : null;
  const nextRequestId =
    activeIndex >= 0 && activeIndex < visibleItems.length - 1 ? visibleItems[activeIndex + 1]?.id : null;

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setReferralSource("ALL");
    setUrgentOnly(false);
    setDuplicateOnly(false);
    setNeedsReviewToday(false);
  };

  return (
    <div className="space-y-6">
      <NewPatientHero />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total intake"
          value={items.length}
          helper="New patient forms received"
          trend="+18% vs yesterday"
          icon={FileText}
          tone="green"
        />
        <KpiCard
          title="Urgent requests"
          value={urgentTotal}
          helper="Marked urgent by pet parents"
          trend="+2 vs yesterday"
          icon={AlertCircle}
          tone="danger"
        />
        <KpiCard
          title="Possible duplicates"
          value={duplicateTotal}
          helper="Need verification"
          trend="+1 vs yesterday"
          icon={Copy}
          tone="purple"
        />
        <KpiCard
          title="Pending review"
          value={items.length}
          helper="Awaiting intake review"
          trend="+12 vs yesterday"
          icon={Stethoscope}
          tone="blue"
        />
      </div>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-[26px]">
        <div>
          <h2 className="text-xl font-extrabold leading-[1.25] tracking-[-0.02em] text-[#102E24]">Intake filters</h2>
          <p className="mt-1 text-[13px] font-medium leading-[1.55] text-[#5F756C]">
            Narrow the queue by urgency, duplicates, date, or search.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[2fr_0.9fr_auto_0.9fr_1.2fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829A91]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 rounded-2xl border-[#DDEBE2] bg-white pl-11 text-sm font-medium"
              placeholder="Search owner, pet, phone, or reason"
            />
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-12 rounded-2xl border-[#DDEBE2] bg-white text-sm font-medium"
          />
          <span className="hidden items-center text-[#829A91] lg:flex">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-12 rounded-2xl border-[#DDEBE2] bg-white text-sm font-medium"
          />
          <Select
            value={referralSource}
            onChange={(event) =>
              setReferralSource(
                event.target.value as NewPatientReferralSource | "NOT_CAPTURED" | "ALL"
              )
            }
            className="h-12 rounded-2xl border-[#DDEBE2] bg-white text-sm font-medium"
          >
            <option value="ALL">All referral sources</option>
            <option value="NOT_CAPTURED">Not captured</option>
            <option value="PET_PARADISE">{formatNewPatientReferralSource("PET_PARADISE")}</option>
            <option value="WEBSITE">{formatNewPatientReferralSource("WEBSITE")}</option>
            <option value="GOOGLE">{formatNewPatientReferralSource("GOOGLE")}</option>
            <option value="PET_BARN">{formatNewPatientReferralSource("PET_BARN")}</option>
            <option value="WELCOME_HOME_MAGAZINE">
              {formatNewPatientReferralSource("WELCOME_HOME_MAGAZINE")}
            </option>
            <option value="REFERRED_BY_ANOTHER_VETERINARIAN">
              {formatNewPatientReferralSource("REFERRED_BY_ANOTHER_VETERINARIAN")}
            </option>
            <option value="REFERRED_BY_FRIEND_OR_FAMILY_MEMBER">
              {formatNewPatientReferralSource("REFERRED_BY_FRIEND_OR_FAMILY_MEMBER")}
            </option>
            <option value="OTHER">{formatNewPatientReferralSource("OTHER")}</option>
          </Select>
          <Button variant="ghost" className="justify-self-start text-sm font-bold text-[#087C48]" onClick={clearFilters}>
            Reset
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <FilterChip
            active={urgentOnly}
            onClick={() => setUrgentOnly((value) => !value)}
            icon={AlertCircle}
            tone="danger"
          >
            Urgent only
          </FilterChip>
          <FilterChip
            active={duplicateOnly}
            onClick={() => setDuplicateOnly((value) => !value)}
            icon={Copy}
            tone="warning"
          >
            Possible duplicates
          </FilterChip>
          <FilterChip
            active={needsReviewToday}
            onClick={() => setNeedsReviewToday((value) => !value)}
            icon={CalendarDays}
          >
            Needs review today
          </FilterChip>
        </div>
      </section>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-[26px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold leading-[1.25] tracking-[-0.02em] text-[#102E24]">Review queue</h2>
            <p className="mt-1 text-[13px] font-medium leading-[1.55] text-[#5F756C]">
              New-patient intake records from the protected endpoint.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SmallPill>{`${visibleItems.length} shown`}</SmallPill>
            <SmallPill tone="danger">{`${urgentCount} urgent`}</SmallPill>
            <SmallPill tone="warning">{`${duplicateCount} duplicate`}</SmallPill>
          </div>
        </div>

        <div className="mt-5">
          {requestsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
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
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-[20px] border border-[#DDEBE2] bg-white">
                <div className="max-h-[860px] overflow-y-auto">
                  <div className="sticky top-0 z-10 hidden min-h-[54px] grid-cols-[0.8fr_1.3fr_1.05fr_1.15fr_1.2fr_0.95fr_0.65fr] gap-4 border-b border-[#DDEBE2] bg-[#EAF7F0] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6F8F82] xl:grid">
                    <div>Priority</div>
                    <div>Patient / Owner</div>
                    <div>Referral</div>
                    <div>Requested visit</div>
                    <div>Reason</div>
                    <div>Submitted</div>
                    <div>Open</div>
                  </div>
                  <div className="divide-y divide-[#E8F0EB]">
                    {visibleItems.map((item, index) => (
                      <NewPatientRow
                        key={item.id}
                        item={item}
                        index={index}
                        onOpen={() => navigate(`/new-patients/${item.id}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 text-sm font-bold tracking-[-0.01em] text-[#087C48] transition hover:translate-x-1"
                >
                  View all new patient requests
                  <ChevronRight className="h-4 w-4" />
                </button>
                {requestsQuery.hasNextPage ? (
                  <Button
                    variant="outline"
                    onClick={() => requestsQuery.fetchNextPage()}
                    disabled={requestsQuery.isFetchingNextPage}
                    className="rounded-2xl border-[#DDEBE2] font-bold"
                  >
                    {requestsQuery.isFetchingNextPage ? "Loading more..." : "Load more requests"}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-7">
        <div>
          <h2 className="text-xl font-extrabold leading-[1.25] tracking-[-0.02em] text-[#102E24]">Intake guidelines</h2>
          <p className="mt-1 text-[13px] font-medium leading-[1.55] text-[#5F756C]">
            Best practices for keeping the intake queue clean and actionable.
          </p>
        </div>
        <div className="mt-6 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <GuidelineItem
            icon={ShieldCheck}
            title="Verify before create"
            text="Check duplicates and confirm owner details before creating a new file."
            tone="green"
          />
          <GuidelineItem
            icon={AlertCircle}
            title="Prioritize urgent first"
            text="Review urgent cases as soon as possible for faster response."
            tone="danger"
          />
          <GuidelineItem
            icon={ClipboardCheck}
            title="Resolve duplicates"
            text="Merge or close duplicates to keep patient records accurate and clean."
            tone="purple"
          />
          <GuidelineItem
            icon={FolderOpen}
            title="Document clearly"
            text="Add accurate notes and upload documents for the care team."
            tone="blue"
          />
        </div>
      </section>

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
