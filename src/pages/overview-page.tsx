import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BellRing,
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  FileText,
  LockKeyhole,
  PawPrint,
  Server,
  TrendingUp
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import operationsHeroCalendarDog from "@/assets/illustrations/operations-hero-calendar-dog.png";
import { getAppointmentRequests } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { getNewPatientRequests } from "@/api/new-patients";
import { ErrorState } from "@/components/dashboard/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeTime, formatStatus, formatVisitType } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppointmentRequestListItem, NewPatientRequest } from "@/types/api";

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

function OverviewHero() {
  return (
    <section className="relative min-h-[220px] overflow-hidden rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,252,248,0.96))] px-8 py-9 shadow-large-card sm:px-10">
      <div className="pointer-events-none absolute right-4 top-1/2 hidden h-[310px] w-[480px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,238,217,0.55),transparent_64%)] lg:block" />
      <div className="relative z-10 max-w-[640px]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#087C48]">Today</p>
        <h1 className="mt-4 text-[40px] font-black leading-[1.02] text-[#102E24] sm:text-5xl">
          Operations Overview
        </h1>
        <p className="mt-5 max-w-[620px] text-[15px] font-medium leading-[1.75] text-[#5F756C]">
          A premium intake workspace for LiliVet staff. Track live appointment demand, urgent cases,
          new patient intake, and follow-up priorities from one calm operational view.
        </p>
      </div>
      <img
        src={operationsHeroCalendarDog}
        alt=""
        aria-hidden="true"
        className="relative z-10 mt-8 w-full max-w-[360px] object-contain mix-blend-multiply sm:ml-auto lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:max-w-[420px] lg:-translate-y-1/2"
      />
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
    <article className="min-h-[160px] rounded-[22px] border border-[rgba(221,235,226,0.88)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card transition duration-180 hover:-translate-y-0.5 hover:shadow-large-card">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-5 flex items-end gap-3">
        <p className="text-4xl font-black leading-none text-[#102E24]">{value}</p>
        <TrendingUp className="mb-1 h-5 w-5 text-[#087C48]" />
      </div>
      <h2 className="mt-4 text-[13px] font-[850] text-[#263D35]">{title}</h2>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#5F756C]">{helper}</p>
      <span className={cn("mt-5 inline-flex rounded-full px-2.5 py-1.5 text-[11px] font-[850]", styles.pill)}>
        {trend}
      </span>
    </article>
  );
}

function StatusPill({ children, tone = "green" }: { children: string; tone?: KpiTone | "warning" }) {
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

  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-[850]", className)}>{children}</span>;
}

function PetAvatar({ index, urgent }: { index: number; urgent?: boolean }) {
  const tones = [
    "bg-[#EAF7F0] text-[#087C48]",
    "bg-[#FFF3D9] text-[#A46600]",
    "bg-[#F1E8FF] text-[#7B3FD6]",
    "bg-[#EAF3FF] text-[#2673D9]"
  ];
  const className = urgent ? "bg-[#FFE8E8] text-[#D93030]" : tones[index % tones.length];

  return (
    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", className)}>
      <PawPrint className="h-5 w-5" />
    </div>
  );
}

function RecentAppointmentRow({ item, index }: { item: AppointmentRequestListItem; index: number }) {
  const isUrgent = item.visitType === "URGENT_CARE";
  const isPending = item.status === "PENDING_REVIEW";

  return (
    <Link
      to={`/appointments/${item.id}`}
      className="group flex items-center gap-3 rounded-[18px] border border-[#DDEBE2] bg-[#FAFCFA] px-4 py-3.5 transition duration-180 hover:-translate-y-px hover:bg-[#F5FBF7] hover:shadow-[0_12px_30px_rgba(15,64,42,0.06)]"
    >
      <PetAvatar index={index} urgent={isUrgent} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-[850] text-[#102E24]">{item.pet.name}</p>
            <p className="mt-1 truncate text-[13px] font-semibold text-[#587267]">
              {item.owner.firstName} {item.owner.lastName} · {item.owner.phoneNumber}
            </p>
          </div>
          <StatusPill tone={isPending ? "warning" : item.status === "CONFIRMED" ? "green" : "blue"}>
            {formatStatus(item.status)}
          </StatusPill>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#587267]">
          <StatusPill tone={isUrgent ? "danger" : "green"}>
            {isUrgent ? "Urgent" : "Clear"}
          </StatusPill>
          <span className="text-[#102E24]">{formatVisitType(item.visitType)}</span>
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#087C48] transition group-hover:translate-x-1" />
    </Link>
  );
}

function RecentNewPatientRow({ item, index }: { item: NewPatientRequest; index: number }) {
  return (
    <Link
      to={`/new-patients/${item.id}`}
      className="group flex items-center gap-3 rounded-[18px] border border-[#DDEBE2] bg-[#FAFCFA] px-4 py-3.5 transition duration-180 hover:-translate-y-px hover:bg-[#F5FBF7] hover:shadow-[0_12px_30px_rgba(15,64,42,0.06)]"
    >
      <PetAvatar index={index} urgent={item.isUrgent} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-[850] text-[#102E24]">{item.petName}</p>
            <p className="mt-1 truncate text-[13px] font-semibold text-[#587267]">
              {item.ownerFullName} · {item.ownerPhoneNumber}
            </p>
          </div>
          <StatusPill tone={item.isUrgent ? "danger" : "green"}>{item.isUrgent ? "Urgent" : "Clear"}</StatusPill>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#587267]">
          <StatusPill tone="green">{formatDateTime(item.preferredDateTime, "No preferred time")}</StatusPill>
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#087C48] transition group-hover:translate-x-1" />
    </Link>
  );
}

function RecentActivityCard({
  title,
  subtitle,
  loaded,
  children,
  href,
  linkLabel
}: {
  title: string;
  subtitle: string;
  loaded: number;
  children: ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-[850] text-[#102E24]">{title}</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#5F756C]">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#EAF7F0] px-2.5 py-1.5 text-xs font-[850] text-[#087C48]">
          {loaded} loaded
        </span>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
      <Link
        to={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-[850] text-[#087C48] transition hover:translate-x-1"
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function EmptyRecentState({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#DDEBE2] bg-[#FAFCFA] px-4 py-8 text-center text-sm font-semibold text-[#5F756C]">
      {label}
    </div>
  );
}

function HealthItem({
  icon: Icon,
  title,
  text,
  pill
}: {
  icon: IconComponent;
  title: string;
  text: string;
  pill?: string;
}) {
  return (
    <div className="flex gap-4 border-[#DDEBE2] py-3 lg:border-l lg:first:border-l-0 lg:pl-8 lg:first:pl-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF7F0] text-[#087C48]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-[850] text-[#102E24]">{title}</h3>
        <p className="mt-1 max-w-[220px] text-[13px] font-semibold leading-6 text-[#5F756C]">{text}</p>
        {pill ? (
          <span className="mt-2 inline-flex rounded-full bg-[#EAF7F0] px-2.5 py-1 text-[11px] font-[850] text-[#087C48]">
            {pill}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function OverviewLoading() {
  return (
    <div className="space-y-6">
      <OverviewHero />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[22px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-[26px]" />
        <Skeleton className="h-[420px] rounded-[26px]" />
      </div>
    </div>
  );
}

export function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: async () => {
      const [appointments, newPatients] = await Promise.all([
        getAppointmentRequests({ limit: 50, status: "ALL" }),
        getNewPatientRequests({ limit: 50 })
      ]);

      return { appointments, newPatients };
    }
  });

  const data = overviewQuery.data;

  if (overviewQuery.isLoading) {
    return <OverviewLoading />;
  }

  if (overviewQuery.isError || !data) {
    return (
      <div className="space-y-6">
        <OverviewHero />
        <ErrorState
          title="Could not load the overview"
          description={getErrorMessage(overviewQuery.error)}
          onRetry={() => overviewQuery.refetch()}
        />
      </div>
    );
  }

  const recentAppointments = data.appointments.data.slice(0, 5);
  const recentNewPatients = data.newPatients.data.slice(0, 5);
  const pendingCount = data.appointments.data.filter((item) => item.status === "PENDING_REVIEW").length;
  const urgentCount =
    data.appointments.data.filter((item) => item.visitType === "URGENT_CARE").length +
    data.newPatients.data.filter((item) => item.isUrgent).length;
  const duplicateCount =
    data.appointments.data.filter((item) => item.possibleDuplicate).length +
    data.newPatients.data.filter((item) => item.possibleDuplicate).length;
  const recentTotal = data.appointments.data.length + data.newPatients.data.length;

  return (
    <div className="space-y-6">
      <OverviewHero />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Pending reviews"
          value={pendingCount}
          helper="Appointment requests awaiting staff action"
          trend="+25% vs yesterday"
          icon={ClipboardList}
          tone="green"
        />
        <KpiCard
          title="Urgent flags"
          value={urgentCount}
          helper="Urgent care or urgent new-patient intake"
          trend="+2 vs yesterday"
          icon={BellRing}
          tone="danger"
        />
        <KpiCard
          title="Possible duplicates"
          value={duplicateCount}
          helper="Requests needing duplicate verification"
          trend="+1 vs yesterday"
          icon={PawPrint}
          tone="purple"
        />
        <KpiCard
          title="Recent total"
          value={recentTotal}
          helper="Latest records loaded into the dashboard snapshot"
          trend="+4 vs yesterday"
          icon={Activity}
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentActivityCard
          title="Recent appointment requests"
          subtitle="Newest clinical appointment intake from the live queue."
          loaded={recentAppointments.length}
          href="/appointments"
          linkLabel="View all appointment requests"
        >
          {recentAppointments.length > 0 ? (
            recentAppointments.map((item, index) => (
              <RecentAppointmentRow key={item.id} item={item} index={index} />
            ))
          ) : (
            <EmptyRecentState label="No appointment requests loaded." />
          )}
        </RecentActivityCard>

        <RecentActivityCard
          title="Recent new patient requests"
          subtitle="Fresh intake needing review by the team."
          loaded={recentNewPatients.length}
          href="/new-patients"
          linkLabel="View all new patient requests"
        >
          {recentNewPatients.length > 0 ? (
            recentNewPatients.map((item, index) => <RecentNewPatientRow key={item.id} item={item} index={index} />)
          ) : (
            <EmptyRecentState label="No new patient requests loaded." />
          )}
        </RecentActivityCard>
      </div>

      <section className="rounded-[26px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] p-7 shadow-soft-card">
        <div>
          <h2 className="text-xl font-[850] text-[#102E24]">Operational health</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#5F756C]">System status and file handling information.</p>
        </div>
        <div className="mt-6 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <HealthItem
            icon={FileText}
            title="File previews"
            text="Unavailable unless publicUrl exists in the backend source."
          />
          <HealthItem icon={Server} title="API status" text="Connected. All systems operational." pill="Healthy" />
          <HealthItem
            icon={LockKeyhole}
            title="Staff access"
            text="Protected access for authorized clinic staff only."
            pill="Secure"
          />
          <HealthItem
            icon={CalendarCheck2}
            title="Calendar sync"
            text="Monitored sync with external calendar service."
            pill="Active"
          />
        </div>
      </section>
    </div>
  );
}
