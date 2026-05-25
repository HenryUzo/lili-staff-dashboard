import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Heart,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Users
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dogCatIllustration from "@/assets/illustrations/dog-cat-sidebar-illustration.png";
import liliVeterinaryHospitalLogo from "@/assets/illustrations/lili-veterinary-hospital-logo.svg";

const supportEmail = "support@liliveterinaryhospital.com";

function FeatureCard({
  icon: Icon,
  title
}: {
  icon: typeof ShieldCheck;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] bg-white/92 p-4 shadow-[0_18px_34px_rgba(16,46,36,0.08)] ring-1 ring-white/80">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6BBF45] to-[#0B6A3B] text-white shadow-[0_14px_28px_rgba(11,106,59,0.24)]">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-semibold leading-6 text-[#173226]">{title}</p>
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
    <div className="space-y-2.5">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[#214437]">
        <Icon className="h-4 w-4 text-[#2E8B57]" />
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          className={`h-14 rounded-2xl border-[#D9E7DD] px-5 text-base shadow-[0_10px_24px_rgba(16,46,36,0.04)] focus:border-[#2E8B57] focus:ring-[#2E8B57]/20 ${
            rightSlot ? "pr-14" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {rightSlot ? (
          <div className="absolute inset-y-0 right-4 flex items-center justify-center">{rightSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

function HelpBox() {
  return (
    <div className="rounded-[24px] bg-gradient-to-r from-[#F7FAEE] to-[#EEF6EA] p-5 shadow-[0_16px_30px_rgba(16,46,36,0.06)] ring-1 ring-white/70">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#2E8B57] shadow-[0_10px_22px_rgba(16,46,36,0.08)]">
          <Headphones className="h-5 w-5" />
        </div>
        <p className="text-sm leading-7 text-[#315244]">
          For login or access issues, please contact IT support at{" "}
          <a className="font-semibold text-[#0B6A3B] underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(221,240,224,0.9),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(214,235,221,0.75),_transparent_28%),linear-gradient(180deg,_#f8fbf2_0%,_#f2f8f3_48%,_#eef5ef_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-[7%] top-[10%] h-14 w-14 rounded-full border border-[#B9D59B]/60 bg-white/20" />
        <div className="absolute right-[9%] top-[8%] h-24 w-24 rounded-full bg-[#E5F1D6]/40 blur-xl" />
        <div className="absolute left-[12%] top-[34%] text-[#CFE1C0]/65">
          <PawPrint className="h-14 w-14" />
        </div>
        <div className="absolute right-[47%] top-[12%] h-40 w-72 rounded-[999px] border border-dashed border-[#A9C96A]/60 [border-width:1.5px]" />
        <div className="absolute left-[46%] top-[28%] text-[#72B642]">
          <Heart className="h-6 w-6 fill-current" />
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1680px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white/80 shadow-[0_26px_80px_rgba(16,46,36,0.12)] backdrop-blur-sm lg:grid-cols-[1.18fr_0.82fr]">
          <section className="order-2 relative overflow-hidden bg-[linear-gradient(180deg,_rgba(251,252,243,0.96)_0%,_rgba(244,249,238,0.94)_55%,_rgba(239,247,236,0.98)_100%)] p-6 sm:p-8 lg:order-1 lg:min-h-[920px] lg:p-10 xl:p-14">
            <div className="pointer-events-none absolute -right-12 top-0 opacity-60">
              <PawPrint className="h-40 w-40 text-[#DCE8CE]" />
            </div>
            <div className="pointer-events-none absolute left-[58%] top-[17%] hidden h-36 w-48 rounded-[999px] border border-dashed border-[#B5D27A]/70 lg:block" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="max-w-[620px]">
                <img
                  src={liliVeterinaryHospitalLogo}
                  alt="Lili Veterinary Hospital"
                  className="h-auto w-[290px] max-w-full sm:w-[360px] lg:w-[420px]"
                />
                <p className="mt-3 text-lg text-[#4E665A] sm:text-[1.75rem] sm:leading-none">
                  Compassionate care with love.
                </p>
              </div>

              <div className="mt-10 max-w-[640px]">
                <h1 className="text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[#103A28] sm:text-[3.6rem] lg:text-[4.5rem]">
                  Internal clinical intake
                  <br />
                  designed for calm,
                  <br />
                  <span className="text-[#6BBF45]">accurate review.</span>
                </h1>
                <div className="mt-5 h-1 w-36 rounded-full bg-gradient-to-r from-[#4A9B4F] to-[#D5E7A4]" />
                <p className="mt-8 max-w-[560px] text-lg leading-9 text-[#415A4D]">
                  Triage appointment demand, review new patient intake, and keep staff decisions aligned with the live
                  Lilivet backend.
                </p>
              </div>

              <div className="mt-8 grid max-w-[430px] gap-5 self-end lg:mt-4 xl:mt-0">
                <FeatureCard icon={ShieldCheck} title="Protected staff-only access" />
                <FeatureCard icon={Users} title="Live operational queues" />
                <FeatureCard icon={FileText} title="Status tracking and file review" />
              </div>

              <div className="relative mt-10 flex flex-1 items-end lg:mt-0">
                <img
                  src={dogCatIllustration}
                  alt="A dog and cat representing LiliVet patients"
                  className="relative z-10 hidden w-[62%] max-w-[520px] object-contain lg:block"
                />

                <div className="absolute bottom-0 right-0 hidden h-[220px] w-[68%] rounded-tl-[140px] bg-[#064D2E] px-10 pb-9 pt-12 text-white shadow-[0_24px_54px_rgba(6,77,46,0.22)] lg:flex lg:flex-col lg:justify-end">
                  <p className="max-w-[260px] text-[2rem] leading-8 text-[#A7D14C]">“</p>
                  <p className="max-w-[280px] text-[1.85rem] font-semibold leading-[1.3] tracking-[-0.03em]">
                    Great care starts with a great team.
                  </p>
                  <Heart className="absolute bottom-8 right-9 h-7 w-7 text-[#89C03F]" />
                </div>

                <div className="mt-8 rounded-[28px] bg-[#064D2E] p-6 text-white lg:hidden">
                  <p className="text-xl font-semibold leading-8">“Great care starts with a great team.”</p>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 flex items-center justify-center bg-white px-5 py-8 sm:px-8 lg:order-2 lg:px-10 xl:px-14">
            <div className="w-full max-w-[520px]">
              <div className="mx-auto max-w-[440px] text-center">
                <p
                  className="text-[3rem] leading-none text-[#0B6A3B] sm:text-[3.5rem]"
                  style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive' }}
                >
                  Welcome back!
                </p>
                <p className="mt-3 text-[1.95rem] font-semibold tracking-[-0.03em] text-[#243A2E]">
                  Sign in to access the dashboard
                </p>

                <div className="relative mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#fbfdf5_0%,_#eaf4de_100%)] shadow-[0_16px_36px_rgba(16,46,36,0.08)]">
                  <div className="absolute -left-3 top-5 text-[#77B73A]">
                    <PawPrint className="h-4 w-4" />
                  </div>
                  <div className="absolute -right-2 top-7 text-[#77B73A]">
                    <Heart className="h-5 w-5" />
                  </div>
                  <Stethoscope className="h-12 w-12 text-[#0B6A3B]" />
                </div>
              </div>

              <div className="mx-auto mt-8 max-w-[440px]">
                {sessionExpired ? <Alert>Your staff session expired. Please sign in again.</Alert> : null}

                <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
                        className="rounded-full p-2 text-[#6A8074] transition hover:bg-[#EDF4EE] hover:text-[#154B34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8B57]/30"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    }
                  />

                  <div className="flex flex-col gap-3 text-sm text-[#476254] sm:flex-row sm:items-center sm:justify-between">
                    <label className="inline-flex items-center gap-3 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-[#A9C8B0] text-[#0B6A3B] focus:ring-[#2E8B57]"
                      />
                      Remember me
                    </label>

                    <a
                      href={`mailto:${supportEmail}?subject=Forgot%20password`}
                      className="font-semibold text-[#0B6A3B] underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#064D2E] to-[#0B6A3B] text-lg text-white shadow-[0_18px_36px_rgba(6,77,46,0.24)] hover:from-[#053E26] hover:to-[#0A5B35]"
                    size="lg"
                    type="submit"
                    disabled={isLoggingIn}
                  >
                    <PawPrint className="h-5 w-5" />
                    {isLoggingIn ? "Signing in..." : "Continue to dashboard"}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>

                <div className="mt-10 flex items-center gap-4 text-sm font-semibold text-[#51695C]">
                  <div className="h-px flex-1 bg-[#D7E4DA]" />
                  <span>Need help?</span>
                  <div className="h-px flex-1 bg-[#D7E4DA]" />
                </div>

                <div className="mt-5">
                  <HelpBox />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
