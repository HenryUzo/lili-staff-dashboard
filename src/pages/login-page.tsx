import { FormEvent, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
  Users
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import liliVeterinaryHospitalLogo from "@/assets/illustrations/lili-veterinary-hospital-logo.svg";

const supportEmail = "support@liliveterinaryhospital.com";

const featureItems = [
  { icon: ShieldCheck, label: "Protected staff-only access" },
  { icon: Users, label: "Live operational queues" },
  { icon: FileText, label: "Status tracking and file review" }
] as const;

function FeaturePill({ icon: Icon, label }: (typeof featureItems)[number]) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#DDE8DF] bg-white/70 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-[#064D2E]" />
      <span className="text-sm font-semibold text-[#12372A]">{label}</span>
    </div>
  );
}

function LoginInput({
  id,
  label,
  icon: Icon,
  rightSlot,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: typeof Mail;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[#12372A]">
        <Icon className="h-4 w-4 text-[#58A942]" />
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          className={`h-[52px] rounded-[14px] border-[#DDE8DF] bg-white px-4 text-base shadow-none focus:border-[#58A942] focus:ring-[#58A942]/20 ${
            rightSlot ? "pr-12" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {rightSlot ? <div className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</div> : null}
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    <main className="min-h-screen bg-[#F4FAF5] px-4 py-4 text-[#12372A] sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1280px] items-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(6,77,46,0.08)] lg:grid-cols-[55fr_45fr]">
          <section className="relative overflow-hidden bg-[#F7FBF4] px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
            <PawPrint
              className="pointer-events-none absolute -right-10 top-8 h-48 w-48 text-[#064D2E] opacity-[0.05]"
              aria-hidden="true"
            />

            <div className="relative flex h-full flex-col justify-center">
              <div>
                <img
                  src={liliVeterinaryHospitalLogo}
                  alt="Lili Veterinary Hospital"
                  className="h-auto w-[190px] max-w-full sm:w-[220px]"
                />
                <p className="mt-4 text-base font-semibold text-[#667A70]">Compassionate care with love.</p>
              </div>

              <div className="mt-10 max-w-[620px] sm:mt-12">
                <h1 className="text-4xl font-semibold leading-tight tracking-normal text-[#12372A] sm:text-5xl lg:text-[3.5rem]">
                  Internal clinical intake
                  <br />
                  designed for calm,
                  <br />
                  <span className="text-[#58A942]">accurate review.</span>
                </h1>
                <p className="mt-6 max-w-[560px] text-base leading-8 text-[#667A70] sm:text-lg">
                  Triage appointment demand, review new patient intake, and keep staff decisions aligned with the live
                  LiliVet backend.
                </p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:max-w-[360px]">
                {featureItems.map((item) => (
                  <FeaturePill key={item.label} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center bg-white px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="w-full max-w-[420px]">
              <div className="rounded-[28px] border border-[#EEF4EF] bg-white p-0">
                <div>
                  <h2 className="text-3xl font-semibold tracking-normal text-[#12372A]">Staff sign in</h2>
                  <p className="mt-3 text-base leading-7 text-[#667A70]">Access the LiliVet operations dashboard.</p>
                </div>

                {sessionExpired ? <Alert className="mt-6">Your staff session expired. Please sign in again.</Alert> : null}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <LoginInput
                    id="email"
                    type="email"
                    label="Staff email"
                    icon={Mail}
                    placeholder="name@liliveterinaryhospital.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />

                  <LoginInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    icon={Lock}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    rightSlot={
                      <button
                        type="button"
                        className="rounded-[10px] p-2 text-[#667A70] transition hover:bg-[#F4FAF5] hover:text-[#064D2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A942]/30"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    }
                  />

                  <div className="flex items-center justify-between gap-4 text-sm text-[#667A70]">
                    <label className="inline-flex min-w-0 items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-[#DDE8DF] text-[#064D2E] focus:ring-[#58A942]"
                      />
                      <span className="whitespace-nowrap">Remember me</span>
                    </label>

                    <a
                      href={`mailto:${supportEmail}?subject=Forgot%20password`}
                      className="whitespace-nowrap font-semibold text-[#064D2E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A942]/30"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    className="h-[52px] w-full rounded-[14px] bg-[#064D2E] text-base font-semibold text-white shadow-[0_14px_28px_rgba(6,77,46,0.16)] hover:bg-[#053E26]"
                    size="lg"
                    type="submit"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Signing in..." : "Continue to dashboard"}
                  </Button>
                </form>

                <p className="mt-7 text-center text-sm leading-6 text-[#667A70]">
                  Need access?{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-semibold text-[#064D2E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A942]/30"
                  >
                    Contact {supportEmail}
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
