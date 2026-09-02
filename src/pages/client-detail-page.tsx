import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getClient, updateClientLifecycle, type ClientLifecycleUpdate } from "@/api/clients";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/permissions";
import type { ClientLifecycleRecord } from "@/types/api";

type LifecycleForm = {
  leadSource: string; referredBy: string; regularVeterinarian: string; firstVisitType: string; doctorSeen: string;
  recheckRecommended: boolean; recheckScheduled: boolean; recheckDate: string; recheckCompleted: boolean; followUpNeeded: boolean;
  firstVisitRevenue: string; additionalServicesRevenue: string; wellnessPlan: string; clientStatus: "ACTIVE" | "INACTIVE" | "DECEASED";
  lastVisitAt: string; nextAppointmentAt: string; notes: string;
};

const dateValue = (value: string | null) => value ? value.slice(0, 10) : "";
const emptyToNull = (value: string) => value.trim() || null;
const formFromLifecycle = (record: ClientLifecycleRecord): LifecycleForm => ({
  leadSource: record.leadSource || "", referredBy: record.referredBy || "", regularVeterinarian: record.regularVeterinarian || "", firstVisitType: record.firstVisitType || "", doctorSeen: record.doctorSeen || "",
  recheckRecommended: record.recheckRecommended, recheckScheduled: record.recheckScheduled, recheckDate: dateValue(record.recheckDate), recheckCompleted: record.recheckCompleted, followUpNeeded: record.followUpNeeded,
  firstVisitRevenue: record.firstVisitRevenue || "", additionalServicesRevenue: record.additionalServicesRevenue || "", wellnessPlan: record.wellnessPlan || "", clientStatus: record.clientStatus,
  lastVisitAt: dateValue(record.lastVisitAt), nextAppointmentAt: dateValue(record.nextAppointmentAt), notes: record.notes || ""
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#60736B]">{label}</span>{children}</label>;
}

function CheckboxField({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled: boolean }) {
  return <label className="flex items-center gap-3 rounded-lg border border-[#DDEBE2] px-4 py-3 text-sm font-semibold text-[#102E24]"><input className="h-4 w-4 accent-[#087C48]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />{label}</label>;
}

export function ClientDetailPage() {
  const { ownerId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission(user, "CLIENTS_MANAGE");
  const clientQuery = useQuery({ queryKey: ["client", ownerId], queryFn: () => getClient(ownerId), enabled: Boolean(ownerId) });
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => clientQuery.data?.clientLifecycleRecords.find((record) => record.id === selectedId) ?? clientQuery.data?.clientLifecycleRecords[0], [clientQuery.data, selectedId]);
  const [form, setForm] = useState<LifecycleForm | null>(null);

  useEffect(() => { if (selected) setForm(formFromLifecycle(selected)); }, [selected]);
  const save = useMutation({
    mutationFn: (input: ClientLifecycleUpdate) => updateClientLifecycle(ownerId, selected!.id, input),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["client", ownerId] }); await queryClient.invalidateQueries({ queryKey: ["clients"] }); }
  });
  const set = <K extends keyof LifecycleForm>(key: K, value: LifecycleForm[K]) => setForm((current) => current ? { ...current, [key]: value } : current);
  const submit = () => {
    if (!form || !selected) return;
    save.mutate({
      leadSource: emptyToNull(form.leadSource), referredBy: emptyToNull(form.referredBy), regularVeterinarian: emptyToNull(form.regularVeterinarian), firstVisitType: emptyToNull(form.firstVisitType), doctorSeen: emptyToNull(form.doctorSeen),
      recheckRecommended: form.recheckRecommended, recheckScheduled: form.recheckScheduled, recheckDate: emptyToNull(form.recheckDate), recheckCompleted: form.recheckCompleted, followUpNeeded: form.followUpNeeded,
      firstVisitRevenue: form.firstVisitRevenue === "" ? null : Number(form.firstVisitRevenue), additionalServicesRevenue: form.additionalServicesRevenue === "" ? null : Number(form.additionalServicesRevenue), wellnessPlan: emptyToNull(form.wellnessPlan), clientStatus: form.clientStatus,
      lastVisitAt: emptyToNull(form.lastVisitAt), nextAppointmentAt: emptyToNull(form.nextAppointmentAt), notes: emptyToNull(form.notes)
    });
  };

  if (clientQuery.isLoading) return <p className="p-6 text-sm text-[#60736B]">Loading client record...</p>;
  if (!clientQuery.data) return <p className="p-6 text-sm text-[#60736B]">Client record was not found.</p>;
  const client = clientQuery.data;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6"><div><Link to="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#087C48]"><ArrowLeft className="h-4 w-4" />Back to clients</Link><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#087C48]">Client lifecycle</p><h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">{client.firstName} {client.lastName}</h1><p className="mt-2 text-sm text-[#60736B]">{client.email || "No email on file"} · {client.phoneNumber}</p></div><UsersRound className="h-10 w-10 text-[#087C48]" /></header>
    <section className="grid gap-5 rounded-[20px] border border-[#DDEBE2] bg-white p-6 md:grid-cols-2"><div><h2 className="text-base font-extrabold text-[#102E24]">Contact details</h2><p className="mt-2 text-sm text-[#60736B]">{[client.addressLine1, client.addressLine2, [client.city, client.state, client.postalCode].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No address imported"}</p><div className="mt-4 space-y-1 text-sm text-[#102E24]">{client.contactMethods.length ? client.contactMethods.map((method) => <p key={method.id}>{method.label || method.channel}: {method.value}{method.isPrimary ? " (primary)" : ""}</p>) : <p className="text-[#60736B]">No additional contact methods.</p>}</div></div><div><h2 className="text-base font-extrabold text-[#102E24]">Source record</h2>{client.externalClientRecords.length ? client.externalClientRecords.map((record) => <p key={record.id} className="mt-2 text-sm text-[#60736B]">{record.source} · Contact status: {record.contactStatus || "Not provided"}</p>) : <p className="mt-2 text-sm text-[#60736B]">No external source identifier has been imported.</p>}</div></section>
    {!client.clientLifecycleRecords.length ? <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-6 text-sm text-[#60736B]">There is no pet lifecycle record for this client yet. New-patient intake creates one automatically.</section> : <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EEE8] pb-5"><div><h2 className="text-xl font-extrabold text-[#102E24]">Pet care and follow-up</h2><p className="mt-1 text-sm text-[#60736B]">Track the first visit, revenue, rechecks, and next actions for each pet.</p></div><Select className="w-full sm:w-64" value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{client.clientLifecycleRecords.map((record) => <option key={record.id} value={record.id}>{record.pet.name} · {record.pet.species}</option>)}</Select></div>
      {form && selected ? <div className="mt-6 space-y-8"><section><h3 className="text-base font-extrabold text-[#102E24]">Acquisition and first visit</h3><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Lead source"><Input disabled={!canManage} value={form.leadSource} onChange={(event) => set("leadSource", event.target.value)} /></Field><Field label="Referred by"><Input disabled={!canManage} value={form.referredBy} onChange={(event) => set("referredBy", event.target.value)} /></Field><Field label="Regular veterinarian"><Input disabled={!canManage} value={form.regularVeterinarian} onChange={(event) => set("regularVeterinarian", event.target.value)} /></Field><Field label="First visit type"><Input disabled={!canManage} value={form.firstVisitType} onChange={(event) => set("firstVisitType", event.target.value)} /></Field><Field label="Doctor seen"><Input disabled={!canManage} value={form.doctorSeen} onChange={(event) => set("doctorSeen", event.target.value)} /></Field><Field label="Wellness plan"><Input disabled={!canManage} value={form.wellnessPlan} onChange={(event) => set("wellnessPlan", event.target.value)} /></Field></div></section>
      <section><h3 className="text-base font-extrabold text-[#102E24]">Recheck and follow-up</h3><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Recheck date"><Input disabled={!canManage} type="date" value={form.recheckDate} onChange={(event) => set("recheckDate", event.target.value)} /></Field><Field label="Last visit"><Input disabled={!canManage} type="date" value={form.lastVisitAt} onChange={(event) => set("lastVisitAt", event.target.value)} /></Field><Field label="Next appointment"><Input disabled={!canManage} type="date" value={form.nextAppointmentAt} onChange={(event) => set("nextAppointmentAt", event.target.value)} /></Field><CheckboxField disabled={!canManage} label="Recheck recommended" checked={form.recheckRecommended} onChange={(value) => set("recheckRecommended", value)} /><CheckboxField disabled={!canManage} label="Recheck scheduled" checked={form.recheckScheduled} onChange={(value) => set("recheckScheduled", value)} /><CheckboxField disabled={!canManage} label="Recheck completed" checked={form.recheckCompleted} onChange={(value) => set("recheckCompleted", value)} /><CheckboxField disabled={!canManage} label="Follow-up needed" checked={form.followUpNeeded} onChange={(value) => set("followUpNeeded", value)} /></div></section>
      <section><h3 className="text-base font-extrabold text-[#102E24]">Revenue and status</h3><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="First visit revenue"><Input disabled={!canManage} type="number" min="0" step="0.01" value={form.firstVisitRevenue} onChange={(event) => set("firstVisitRevenue", event.target.value)} /></Field><Field label="Additional services revenue"><Input disabled={!canManage} type="number" min="0" step="0.01" value={form.additionalServicesRevenue} onChange={(event) => set("additionalServicesRevenue", event.target.value)} /></Field><Field label="Client status"><Select disabled={!canManage} value={form.clientStatus} onChange={(event) => set("clientStatus", event.target.value as LifecycleForm["clientStatus"])}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="DECEASED">Deceased</option></Select></Field></div><Field label="Notes"><textarea disabled={!canManage} className="min-h-32 w-full rounded-xl border border-[#DDEBE2] bg-white px-4 py-3 text-sm text-[#102E24] outline-none focus:border-[#087C48] disabled:cursor-not-allowed disabled:bg-[#F3F6F4]" value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field></section>
      {!canManage ? <p className="text-sm text-[#60736B]">You have view-only access to client lifecycle records.</p> : <div className="flex items-center gap-3 border-t border-[#E5EEE8] pt-6"><Button disabled={save.isPending} onClick={submit}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{save.isPending ? "Saving" : "Save lifecycle record"}</Button>{save.isError ? <p className="text-sm font-semibold text-red-600">Unable to save this record. Check the values and try again.</p> : null}{save.isSuccess ? <p className="text-sm font-semibold text-[#087C48]">Changes saved.</p> : null}</div>}</div> : null}</section>}
  </div>;
}
