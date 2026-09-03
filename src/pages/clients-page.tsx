import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileUp, Loader2, Mail, MessageSquare, Search, UsersRound } from "lucide-react";
import { getClientImportHistory, getClients, importClientTracker } from "@/api/clients";
import { getErrorMessage } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { ClientDetailsDrawer } from "@/components/clients/client-details-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

const statusStyle = (subscribed: boolean) => subscribed ? "bg-[#EAF7F0] text-[#087C48]" : "bg-[#F3F6F4] text-[#60736B]";

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [consent, setConsent] = useState<"ALL" | "EMAIL" | "SMS" | "NONE">("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = hasPermission(user, "CLIENTS_MANAGE");
  const clients = useQuery({ queryKey: ["clients", search, consent], queryFn: () => getClients({ search: search || undefined, consent: consent === "ALL" ? undefined : consent }) });
  const importHistory = useQuery({ queryKey: ["client-import-history"], queryFn: getClientImportHistory, enabled: canManage });
  const importer = useMutation({
    mutationFn: importClientTracker,
    onSuccess: async (summary) => {
      setResult(`${summary.imported} added, ${summary.updated} updated${summary.skipped.length ? `, ${summary.skipped.length} skipped` : ""}.`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["clients"] }), queryClient.invalidateQueries({ queryKey: ["client-import-history"] })]);
    },
    onError: (error) => setImportError(getErrorMessage(error, "The tracker could not be imported. Please try again.")),
  });

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087C48]">Client communications</p><h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">Clients</h1><p className="mt-2 text-sm text-[#60736B]">A consent-aware client directory. Promotional sending is not enabled in this phase.</p></div>
      <div className="flex items-center gap-3">{canManage ? <><input ref={inputRef} className="hidden" type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setResult(null); setImportError(null); importer.mutate(file); } event.target.value = ""; }} /><Button variant="outline" disabled={importer.isPending} onClick={() => inputRef.current?.click()}>{importer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{importer.isPending ? "Importing" : "Import tracker file"}</Button></> : null}<UsersRound className="h-10 w-10 text-[#087C48]" /></div>
    </header>
    {result ? <p className="rounded-lg border border-[#B9E4C9] bg-[#EAF7F0] px-4 py-3 text-sm font-semibold text-[#087C48]">Import complete: {result}</p> : null}
    {importer.isError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Import failed: {importError}</p> : null}
    <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789087]" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client, phone, email, or pet" /></div><Select value={consent} onChange={(event) => setConsent(event.target.value as typeof consent)}><option value="ALL">All consent states</option><option value="EMAIL">Email marketing opted in</option><option value="SMS">SMS marketing opted in</option><option value="NONE">No marketing consent</option></Select></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-b border-[#E5EEE8] text-xs uppercase tracking-wide text-[#789087]"><tr><th className="px-3 py-3">Client</th><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Pets</th><th className="px-3 py-3">Lead source</th><th className="px-3 py-3">Recheck</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">SMS</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{clients.isLoading ? <tr><td className="px-3 py-6 text-[#60736B]" colSpan={9}>Loading clients...</td></tr> : null}{clients.isError ? <tr><td className="px-3 py-6 text-red-700" colSpan={9}>Could not load clients: {getErrorMessage(clients.error, "Please try again.")}</td></tr> : null}{clients.data?.data.map((client) => { const email = client.clientProfile?.emailMarketingStatus === "SUBSCRIBED"; const sms = client.clientProfile?.smsMarketingStatus === "SUBSCRIBED"; const lifecycle = client.clientLifecycleRecords[0]; return <tr key={client.id} className="border-b border-[#F0F4F1]"><td className="px-3 py-4 font-bold text-[#102E24]">{client.firstName} {client.lastName}</td><td className="px-3 py-4 text-[#60736B]"><div>{client.email || "No email"}</div><div>{client.phoneNumber || "No phone"}</div></td><td className="px-3 py-4 text-[#60736B]">{client.pets.map((pet) => pet.name).join(", ") || "No pets on file"}</td><td className="px-3 py-4 text-[#60736B]">{lifecycle?.leadSource || "Not captured"}</td><td className="px-3 py-4 text-[#60736B]">{lifecycle?.recheckScheduled ? (lifecycle.recheckCompleted ? "Complete" : "Scheduled") : lifecycle?.recheckRecommended ? "Recommended" : "No recheck"}</td><td className="px-3 py-4 text-[#60736B]">{lifecycle?.clientStatus ? lifecycle.clientStatus.replace("_", " ") : "Active"}</td><td className="px-3 py-4"><ConsentBadge icon={<Mail className="h-3.5 w-3.5" />} subscribed={email} /></td><td className="px-3 py-4"><ConsentBadge icon={<MessageSquare className="h-3.5 w-3.5" />} subscribed={sms} /></td><td className="px-3 py-4 text-right"><Button size="sm" variant="outline" onClick={() => setSelectedClientId(client.id)}><Eye className="h-4 w-4" />View details</Button></td></tr>; })}</tbody></table>{!clients.isLoading && !clients.isError && !clients.data?.data.length ? <p className="py-8 text-center text-sm text-[#60736B]">No clients match these filters.</p> : null}</div>
    </section>
    {canManage ? <ImportHistorySection loading={importHistory.isLoading} error={importHistory.isError ? getErrorMessage(importHistory.error, "Please try again.") : null} runs={importHistory.data} /> : null}
    <ClientDetailsDrawer ownerId={selectedClientId} open={Boolean(selectedClientId)} onOpenChange={(open) => { if (!open) setSelectedClientId(null); }} />
  </div>;
}

function ConsentBadge({ icon, subscribed }: { icon: ReactNode; subscribed: boolean }) { return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle(subscribed)}`}>{icon}{subscribed ? "Opted in" : "Not opted in"}</span>; }

function ImportHistorySection({ loading, error, runs }: { loading: boolean; error: string | null; runs: Awaited<ReturnType<typeof getClientImportHistory>> | undefined }) {
  return <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087C48]">Import activity</p><h2 className="mt-1 text-xl font-extrabold text-[#102E24]">Recent tracker imports</h2></div>{loading ? <p className="mt-4 text-sm text-[#60736B]">Loading import activity...</p> : null}{error ? <p className="mt-4 text-sm font-semibold text-red-700">Could not load import activity: {error}</p> : null}{!loading && !error && runs?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#E5EEE8] text-xs uppercase tracking-wide text-[#789087]"><tr><th className="px-3 py-3">File</th><th className="px-3 py-3">Outcome</th><th className="px-3 py-3">Skipped rows</th><th className="px-3 py-3">Imported by</th><th className="px-3 py-3">When</th></tr></thead><tbody>{runs.map((run) => <tr key={run.id} className="border-b border-[#F0F4F1]"><td className="px-3 py-4 font-semibold text-[#102E24]">{run.originalFileName}<div className="mt-1 text-xs font-medium text-[#789087]">{run.totalRows} tracker rows</div></td><td className="px-3 py-4 text-[#60736B]"><span className="font-bold text-[#087C48]">{run.importedCount} added</span>, {run.updatedCount} updated</td><td className="px-3 py-4 text-[#60736B]">{run.skippedCount ? <details><summary className="cursor-pointer font-semibold text-[#B45309]">{run.skippedCount} skipped</summary><ul className="mt-2 max-w-[290px] space-y-1 text-xs">{run.skippedRows?.slice(0, 5).map((skip) => <li key={`${run.id}-${skip.row}`}>Row {skip.row}: {skip.reason}</li>)}</ul></details> : "None"}</td><td className="px-3 py-4 text-[#60736B]">{run.initiatedBy?.email ?? "System"}</td><td className="px-3 py-4 text-[#60736B]">{formatRelativeTime(run.createdAt)}</td></tr>)}</tbody></table></div> : null}{!loading && !error && !runs?.length ? <p className="mt-4 text-sm text-[#60736B]">No tracker imports have been recorded yet.</p> : null}</section>;
}
