import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const destination = (location.state as { from?: string } | null)?.from ?? "/";
  const sessionExpired = new URLSearchParams(location.search).get("reason") === "session-expired";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login(email, password);
      toast.success("Signed in successfully");
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to sign in"));
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-vet-grid bg-[length:theme(backgroundSize.vet-grid)] p-4">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-accent/60 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_480px]">
        <div className="space-y-8 rounded-[36px] border border-white/70 bg-white/70 p-8 shadow-shell backdrop-blur-xl lg:p-12">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-soft">
            <HeartPulse className="h-4 w-4" />
            Lilivet staff operations
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-tight text-foreground lg:text-6xl">
              Internal clinical intake designed for calm, accurate review.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Triage appointment demand, review new patient intake, and keep staff decisions aligned with the live
              Lilivet backend.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Protected staff-only access",
              "Live operational queues",
              "Status tracking and file review"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-soft">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm font-semibold text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-white/70">
          <CardHeader className="bg-gradient-to-br from-primary to-[#1f4a39] text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Staff sign in</p>
            <CardTitle className="font-serif text-3xl text-primary-foreground">Access the dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6 lg:p-8">
            {sessionExpired ? <Alert>Your staff session expired. Please sign in again.</Alert> : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="email">
                  Staff email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="frontdesk@lilivet.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Continue to dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-sm leading-6 text-muted-foreground">
              This frontend stores the staff JWT locally for the active workstation and automatically clears it if the
              backend returns `401 Unauthorized`.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
