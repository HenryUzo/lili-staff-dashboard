import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <section className="rounded-[22px] border border-[#F1CFCC] bg-white px-8 py-16 text-center">
      <LockKeyhole className="mx-auto h-10 w-10 text-[#C23B36]" />
      <h1 className="mt-4 text-2xl font-extrabold text-[#102E24]">Access not available</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#60736B]">Your account does not have permission to open this area. Contact a Super Admin if you need access.</p>
      <Link to="/" className="mt-6 inline-flex rounded-xl bg-[#087C48] px-5 py-3 text-sm font-bold text-white">Back to dashboard</Link>
    </section>
  );
}
