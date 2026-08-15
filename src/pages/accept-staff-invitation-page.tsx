import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptStaffInvitation, getStaffInvitation } from "@/api/staff";
import { getErrorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AcceptStaffInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const invitation = useQuery({ queryKey: ["staff-invitation", token], queryFn: () => getStaffInvitation(token), enabled: token.length === 64, retry: false });
  const accept = useMutation({
    mutationFn: () => acceptStaffInvitation(token, password),
    onSuccess: () => toast.success("Password set. You can now sign in."),
    onError: (error) => toast.error(getErrorMessage(error, "Could not accept invitation"))
  });
  const disabled = password.length < 12 || password !== confirmation || accept.isPending;
  if (!token || invitation.isError) return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-extrabold">Invitation unavailable</h1><p className="mt-3 text-[#60736B]">This invitation is invalid or has expired.</p><Link to="/login" className="mt-6 inline-block text-[#087C48]">Go to sign in</Link></main>;
  if (accept.isSuccess) return <main className="mx-auto max-w-lg p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[#087C48]" /><h1 className="mt-4 text-2xl font-extrabold">Your access is ready</h1><Link to="/login" className="mt-6 inline-block rounded-xl bg-[#087C48] px-5 py-3 font-bold text-white">Sign in</Link></main>;
  return <main className="mx-auto max-w-lg p-8"><h1 className="text-3xl font-extrabold text-[#102E24]">Set your staff password</h1><p className="mt-2 text-[#60736B]">{invitation.isLoading ? "Checking invitation..." : `Create a password for ${invitation.data?.email}.`}</p><div className="mt-7 space-y-4"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (12 characters minimum)" /><Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm password" /><Button className="w-full" disabled={disabled} onClick={() => accept.mutate()}>{accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Activate staff access</Button></div></main>;
}
