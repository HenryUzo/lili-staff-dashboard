import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailPlus, RotateCw, ShieldCheck, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/http";
import { getStaffUsers, inviteStaffUser, resendStaffInvitation, updateManagedStaffUser } from "@/api/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ManagedStaffUser, PermissionKey } from "@/types/api";

const permissionGroups: Array<{ title: string; description: string; keys: Array<{ key: PermissionKey; label: string }> }> = [
  { title: "Appointment requests", description: "View incoming requests or manage scheduling and statuses.", keys: [{ key: "APPOINTMENTS_VIEW", label: "View requests" }, { key: "APPOINTMENTS_MANAGE", label: "Manage requests" }] },
  { title: "New patient requests", description: "View new-patient intake records.", keys: [{ key: "NEW_PATIENTS_VIEW", label: "View requests" }] },
  { title: "Pet Care Library", description: "Read, write, publish, or manage veterinary reviewers.", keys: [{ key: "PET_CARE_VIEW", label: "View library" }, { key: "PET_CARE_EDIT", label: "Edit articles" }, { key: "PET_CARE_PUBLISH", label: "Publish and archive" }, { key: "PET_CARE_REVIEWERS", label: "Manage veterinarians" }] }
];

function PermissionEditor({ value, onChange }: { value: PermissionKey[]; onChange: (permissions: PermissionKey[]) => void }) {
  const toggle = (key: PermissionKey) => onChange(value.includes(key) ? value.filter((permission) => permission !== key) : [...value, key]);
  return <div className="space-y-4">{permissionGroups.map((group) => <section key={group.title} className="rounded-xl border border-[#DDEBE2] p-4"><h3 className="font-bold text-[#102E24]">{group.title}</h3><p className="mt-1 text-xs leading-5 text-[#60736B]">{group.description}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{group.keys.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#F7FAF8] px-3 py-2 text-sm font-semibold text-[#224438]"><input type="checkbox" checked={value.includes(item.key)} onChange={() => toggle(item.key)} className="h-4 w-4 accent-[#087C48]" />{item.label}</label>)}</div></section>)}</div>;
}

function statusLabel(user: ManagedStaffUser) {
  if (!user.isActive && user.invitationStatus === "PENDING") return "Invitation pending";
  return user.isActive ? "Active" : "Inactive";
}

export function TeamAccessPage() {
  const client = useQueryClient();
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const users = useQuery({ queryKey: ["staff-users"], queryFn: getStaffUsers });
  const selected = useMemo(() => users.data?.find((user) => user.id === selectedId) ?? null, [selectedId, users.data]);
  const refresh = () => client.invalidateQueries({ queryKey: ["staff-users"] });
  const invite = useMutation({ mutationFn: () => inviteStaffUser({ email, permissions }), onSuccess: () => { toast.success("Invitation sent"); setEmail(""); setPermissions([]); refresh(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not send invitation")) });
  const update = useMutation({ mutationFn: (input: { id: string; isActive?: boolean; permissions?: PermissionKey[] }) => updateManagedStaffUser(input.id, input), onSuccess: () => { toast.success("Staff access updated"); refresh(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not update staff access")) });
  const resend = useMutation({ mutationFn: resendStaffInvitation, onSuccess: () => { toast.success("Invitation resent"); refresh(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not resend invitation")) });

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087C48]">Super Admin</p><h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">Team & Access</h1><p className="mt-2 text-sm text-[#60736B]">Invite staff and control which clinic operations they can access.</p></div><ShieldCheck className="h-10 w-10 text-[#087C48]" /></header>
    <div className="grid gap-6 xl:grid-cols-[minmax(350px,0.9fr)_minmax(480px,1.1fr)]">
      <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-6"><div className="flex items-center gap-2"><MailPlus className="h-5 w-5 text-[#087C48]" /><h2 className="text-xl font-extrabold">Invite admin</h2></div><p className="mt-2 text-sm leading-6 text-[#60736B]">They receive a seven-day, single-use password setup link. Choose only the access they need.</p><div className="mt-5"><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#60736B]">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@liliveterinaryhospital.com" /></div><div className="mt-5"><PermissionEditor value={permissions} onChange={setPermissions} /></div><Button className="mt-5 w-full" disabled={!email || invite.isPending} onClick={() => invite.mutate()}>{invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}Send invitation</Button></section>
      <section className="rounded-[20px] border border-[#DDEBE2] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">Staff accounts</h2><p className="mt-1 text-sm text-[#60736B]">{users.data?.length ?? 0} accounts</p></div><UserRoundCog className="h-6 w-6 text-[#087C48]" /></div><div className="mt-5 space-y-3">{users.isLoading ? <p className="text-sm text-[#60736B]">Loading staff accounts...</p> : null}{users.data?.map((user) => <button type="button" key={user.id} onClick={() => { setSelectedId(user.id); setPermissions(user.permissions); }} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === user.id ? "border-[#087C48] bg-[#F1F9F4]" : "border-[#DDEBE2] hover:border-[#A8CDBA]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-[#102E24]">{user.email}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#789087]">{user.role.replace("_", " ")} · {statusLabel(user)}</p></div><span className="rounded-full bg-[#EAF7F0] px-2 py-1 text-xs font-bold text-[#087C48]">{user.permissions.length} permissions</span></div></button>)}</div>{selected ? <div className="mt-6 border-t border-[#E5EEE8] pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-extrabold text-[#102E24]">{selected.email}</h3><p className="text-sm text-[#60736B]">{selected.role === "SUPER_ADMIN" ? "Super Admin access cannot be restricted." : "Update permissions or account status."}</p></div>{selected.invitationStatus === "PENDING" ? <Button variant="outline" size="sm" disabled={resend.isPending} onClick={() => resend.mutate(selected.id)}><RotateCw className="h-4 w-4" />Resend invite</Button> : null}</div>{selected.role !== "SUPER_ADMIN" ? <><div className="mt-4"><PermissionEditor value={permissions} onChange={setPermissions} /></div><div className="mt-4 flex flex-wrap gap-3"><Button disabled={update.isPending} onClick={() => update.mutate({ id: selected.id, permissions })}>Save access</Button><Button variant={selected.isActive ? "destructive" : "outline"} disabled={update.isPending} onClick={() => update.mutate({ id: selected.id, isActive: !selected.isActive })}>{selected.isActive ? "Deactivate" : "Reactivate"}</Button></div></> : null}</div> : null}</section>
    </div>
  </div>;
}
