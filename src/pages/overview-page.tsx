import { useQuery } from "@tanstack/react-query";
import { ClipboardList, PawPrint, ShieldAlert, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { getAppointmentRequests } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { getNewPatientRequests } from "@/api/new-patients";
import { DuplicateBadge } from "@/components/dashboard/duplicate-badge";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeTime, formatVisitType } from "@/lib/format";

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
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Today"
          title="Operations Overview"
          description="Loading a live view of appointment and new patient activity."
        />
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !data) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Today"
          title="Operations Overview"
          description="A real-time snapshot of current intake activity and follow-up pressure."
        />
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Today"
        title="Operations Overview"
        description="A premium intake workspace for Lilivet staff. Counts below are derived from the latest live queue records returned by the backend."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Pending reviews"
          value={String(pendingCount)}
          hint="Appointment requests awaiting staff action"
          icon={ClipboardList}
        />
        <SummaryCard
          title="Urgent flags"
          value={String(urgentCount)}
          hint="Urgent care or urgent new-patient intake"
          icon={ShieldAlert}
        />
        <SummaryCard
          title="Possible duplicates"
          value={String(duplicateCount)}
          hint="Requests needing duplicate verification"
          icon={PawPrint}
        />
        <SummaryCard
          title="Recent total"
          value={String(data.appointments.data.length + data.newPatients.data.length)}
          hint="Latest records loaded into the dashboard snapshot"
          icon={Stethoscope}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent appointment requests</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Newest clinical appointment intake from the live queue.</p>
            </div>
            <Badge variant="accent">{recentAppointments.length} loaded</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAppointments.map((item) => (
              <Link
                key={item.id}
                to={`/appointments/${item.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-4 transition hover:border-primary/30 hover:bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.pet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.owner.firstName} {item.owner.lastName} · {item.owner.phoneNumber}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{formatVisitType(item.visitType)}</Badge>
                  <DuplicateBadge duplicate={item.possibleDuplicate} urgent={item.visitType === "URGENT_CARE"} />
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent new patient requests</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Fresh intake needing review by the team.</p>
            </div>
            <Badge variant="accent">{recentNewPatients.length} loaded</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNewPatients.map((item) => (
              <Link
                key={item.id}
                to={`/new-patients/${item.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-4 transition hover:border-primary/30 hover:bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.petName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.ownerFullName} · {item.ownerPhoneNumber}
                    </p>
                  </div>
                  <DuplicateBadge duplicate={item.possibleDuplicate} urgent={item.isUrgent} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{formatDateTime(item.preferredDateTime)}</Badge>
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operational note</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          File preview and download actions require the backend to return a usable `publicUrl` on uploaded files. The
          checked-in backend source includes file metadata but does not expose a file-serving route, so the UI shows a
          safe unavailable state when a public link is missing.
        </CardContent>
      </Card>
    </div>
  );
}
