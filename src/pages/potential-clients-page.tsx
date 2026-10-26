import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserRoundSearch } from "lucide-react";
import { confirmPotentialClientEmailConsent, getPotentialClients } from "@/api/clients";
import { getErrorMessage } from "@/api/http";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/auth-context";
import { hasPermission } from "@/lib/permissions";

const consentLabels = {
  SUBSCRIBED: "Email opt-in recorded",
  PENDING_CONFIRMATION: "Confirmation pending",
  NOT_SUBSCRIBED: "No email opt-in",
  UNSUBSCRIBED: "Unsubscribed",
  SUPPRESSED: "Suppressed"
};

export function PotentialClientsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = hasPermission(user, "CLIENTS_MANAGE");
  const prospects = useInfiniteQuery({ queryKey: ["potential-clients", search], initialPageParam: null as string | null, queryFn: ({ pageParam }) => getPotentialClients({ search: search || undefined, limit: 100, cursor: pageParam }), getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined });
  const confirmConsent = useMutation({ mutationFn: confirmPotentialClientEmailConsent, onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ["potential-clients"] }), queryClient.invalidateQueries({ queryKey: ["campaign-potential-client-directory"] })]) });
  const potentialClients = prospects.data?.pages.flatMap((page) => page.data) ?? [];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087C48]">Client communications</p><h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">Potential Clients</h1><p className="mt-2 max-w-3xl text-sm text-[#60736B]">People who shared their details through a lead form or started an appointment request. Their entry source and email permission are shown below.</p>{canManage ? <p className="mt-2 max-w-3xl text-xs text-[#60736B]">For newsletter or giveaway signups, verify the email confirmation in Brevo before marking it confirmed here.</p> : null}</div>
      <UserRoundSearch className="h-10 w-10 text-[#087C48]" />
    </header>
    <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-5">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789087]" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, phone, or source" /></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-[#E5EEE8] text-xs uppercase tracking-wide text-[#789087]"><tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Email permission</th><th className="px-3 py-3">Added</th><th className="px-3 py-3">Action</th></tr></thead><tbody>
        {prospects.isLoading ? <tr><td className="px-3 py-6 text-[#60736B]" colSpan={6}>Loading potential clients…</td></tr> : null}
        {prospects.isError ? <tr><td className="px-3 py-6 text-red-700" colSpan={6}>Could not load potential clients: {getErrorMessage(prospects.error, "Please try again.")}</td></tr> : null}
        {potentialClients.map((lead) => <tr key={lead.id} className="border-b border-[#F0F4F1]"><td className="px-3 py-4 font-bold text-[#102E24]">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Name not provided"}</td><td className="px-3 py-4 text-[#60736B]"><div>{lead.email || "No email"}</div><div>{lead.phoneNumber || "No phone"}</div></td><td className="px-3 py-4 text-[#60736B]">{lead.sourceLabel}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lead.emailMarketingStatus === "SUBSCRIBED" ? "bg-[#EAF7F0] text-[#087C48]" : "bg-[#F3F6F4] text-[#60736B]"}`}>{consentLabels[lead.emailMarketingStatus]}</span></td><td className="px-3 py-4 text-[#60736B]">{new Date(lead.createdAt).toLocaleDateString()}</td><td className="px-3 py-4">{canManage && lead.emailMarketingStatus === "PENDING_CONFIRMATION" ? <Button size="sm" variant="outline" disabled={confirmConsent.isPending} title="Use only after verifying the person completed the email confirmation step." onClick={() => confirmConsent.mutate(lead.id)}>Mark confirmed</Button> : "—"}</td></tr>)}
        {!prospects.isLoading && !prospects.isError && !potentialClients.length ? <tr><td className="px-3 py-8 text-center text-[#60736B]" colSpan={6}>No potential clients match this search.</td></tr> : null}
      </tbody></table></div>
      {prospects.hasNextPage ? <div className="mt-4 flex justify-center"><Button variant="outline" onClick={() => prospects.fetchNextPage()} disabled={prospects.isFetchingNextPage}>{prospects.isFetchingNextPage ? "Loading…" : "Load more potential clients"}</Button></div> : null}
    </section>
  </div>;
}
