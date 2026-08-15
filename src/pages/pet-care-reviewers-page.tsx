import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ImageUp, Loader2, Mail, Pencil, Plus, Stethoscope, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createPetCareReviewer, getPetCareReviewers, updatePetCareReviewer, uploadPetCareHeroImage } from "@/api/pet-care";
import { getErrorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PetCareReviewer, PetCareReviewerInput } from "@/types/api";

const blankReviewer: PetCareReviewerInput = {
  slug: "",
  name: "",
  email: "",
  credentials: "DVM",
  role: "Veterinary Reviewer",
  photoUrl: null,
  shortBio: "",
  isActive: true,
};
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ReviewerAvatar({ reviewer }: { reviewer: Pick<PetCareReviewerInput, "name" | "photoUrl"> }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [reviewer.photoUrl]);

  if (reviewer.photoUrl && !imageFailed) {
    return <img src={reviewer.photoUrl} alt="" onError={() => setImageFailed(true)} className="h-14 w-14 rounded-full border border-[#DDEBE2] object-cover" />;
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7F0] text-[#087C48]">
      <UserRound className="h-6 w-6" />
    </div>
  );
}

export function PetCareReviewersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PetCareReviewerInput>(blankReviewer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reviewersQuery = useQuery({ queryKey: ["pet-care-reviewers"], queryFn: getPetCareReviewers });
  const selected = useMemo(
    () => reviewersQuery.data?.find((reviewer) => reviewer.id === selectedId) ?? null,
    [reviewersQuery.data, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setDraft({
      slug: selected.slug,
      name: selected.name,
      email: selected.email ?? "",
      credentials: selected.credentials,
      role: selected.role,
      photoUrl: selected.photoUrl,
      shortBio: selected.shortBio,
      isActive: selected.isActive,
    });
    setErrors({});
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: (input: PetCareReviewerInput) =>
      selectedId ? updatePetCareReviewer(selectedId, input) : createPetCareReviewer(input),
    onSuccess: async (reviewer) => {
      toast.success(selectedId ? "Veterinarian updated" : "Veterinarian added");
      await queryClient.invalidateQueries({ queryKey: ["pet-care-reviewers"] });
      setSelectedId(reviewer.id);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save veterinarian")),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => updatePetCareReviewer(id, { isActive: false }),
    onSuccess: async () => {
      toast.success("Veterinarian removed from future reviews");
      await queryClient.invalidateQueries({ queryKey: ["pet-care-reviewers"] });
      startNew();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not remove veterinarian")),
  });
  const imageUploadMutation = useMutation({
    mutationFn: uploadPetCareHeroImage,
    onSuccess: (image) => {
      set("photoUrl", image.url);
      toast.success("Profile image uploaded");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not upload profile image")),
  });

  const startNew = () => {
    setSelectedId(null);
    setDraft(blankReviewer);
    setErrors({});
  };

  const save = () => {
    const nextErrors: Record<string, string> = {};
    if (draft.name.trim().length < 2) nextErrors.name = "Enter the veterinarian's full name.";
    if (!draft.email || !/^\S+@\S+\.\S+$/.test(draft.email)) nextErrors.email = "Enter a valid email address.";
    if (!draft.credentials.trim()) nextErrors.credentials = "Enter professional credentials.";
    if (draft.role.trim().length < 2) nextErrors.role = "Enter the veterinarian's role.";
    if (draft.shortBio.trim().length < 20) nextErrors.shortBio = "Add a biography of at least 20 characters.";
    if (!draft.slug) nextErrors.slug = "Enter a profile slug.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    saveMutation.mutate({
      ...draft,
      name: draft.name.trim(),
      email: draft.email?.trim() ?? "",
      credentials: draft.credentials.trim(),
      role: draft.role.trim(),
      shortBio: draft.shortBio.trim(),
      slug: slugify(draft.slug),
      photoUrl: draft.photoUrl?.trim() || null,
    });
  };

  const set = <K extends keyof PetCareReviewerInput>(key: K, value: PetCareReviewerInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
        <div>
          <button type="button" onClick={() => navigate("/pet-care")} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#087C48]">
            <ArrowLeft className="h-4 w-4" /> Back to articles
          </button>
          <p className="text-xs font-bold uppercase text-[#087C48]">Pet Care Library</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">Veterinarian directory</h1>
          <p className="mt-2 text-sm text-[#60736B]">Manage the clinicians available for article review and approval.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> Add veterinarian</Button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(520px,1.2fr)]">
        <section className="rounded-[18px] border border-[#DDEBE2] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#102E24]">Veterinarians</h2>
            <span className="text-sm font-semibold text-[#60736B]">{reviewersQuery.data?.length ?? 0}</span>
          </div>
          <div className="mt-4 space-y-3">
            {reviewersQuery.isLoading ? <p className="text-sm text-[#60736B]">Loading veterinarians...</p> : null}
            {!reviewersQuery.isLoading && !reviewersQuery.data?.length ? (
              <div className="rounded-lg border border-dashed border-[#BFD8CA] bg-[#F7FAF8] px-5 py-8 text-center">
                <Stethoscope className="mx-auto h-7 w-7 text-[#087C48]" />
                <p className="mt-3 font-extrabold text-[#102E24]">No veterinarians added yet</p>
                <p className="mt-1 text-sm leading-6 text-[#60736B]">Complete the form to add the first medical reviewer.</p>
              </div>
            ) : null}
            {reviewersQuery.data?.map((reviewer) => (
              <button
                key={reviewer.id}
                type="button"
                onClick={() => setSelectedId(reviewer.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${selectedId === reviewer.id ? "border-[#087C48] bg-[#F2FBF6]" : "border-[#DDEBE2] hover:border-[#A8CDBA]"}`}
              >
                <ReviewerAvatar reviewer={reviewer} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold text-[#102E24]">{reviewer.name}, {reviewer.credentials}</span>
                  <span className="mt-1 block truncate text-sm text-[#60736B]">{reviewer.email || "Email not added"}</span>
                  <span className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${reviewer.isActive ? "text-[#087C48]" : "text-[#8A5A52]"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {reviewer.isActive ? "Available for review" : "Inactive"}
                  </span>
                </span>
                <Pencil className="h-4 w-4 text-[#789087]" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#DDEBE2] bg-white p-6">
          <div className="flex items-center gap-3 border-b border-[#E5EEE8] pb-5">
            <ReviewerAvatar reviewer={draft} />
            <div>
              <h2 className="text-xl font-extrabold text-[#102E24]">{selectedId ? "Edit veterinarian" : "Add veterinarian"}</h2>
              <p className="mt-1 text-sm text-[#60736B]">These details appear in the reviewer selector and published medical-review attribution.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <ReviewerField label="Full name" required error={errors.name}>
              <Input value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((current) => ({ ...current, name, slug: selectedId ? current.slug : slugify(name) })); }} placeholder="Dr. Firstname Lastname" />
            </ReviewerField>
            <ReviewerField label="Email" required error={errors.email}>
              <div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#789087]" /><Input className="pl-10" type="email" value={draft.email ?? ""} onChange={(event) => set("email", event.target.value)} placeholder="doctor@example.com" /></div>
            </ReviewerField>
            <ReviewerField label="Credentials" required error={errors.credentials}>
              <Input value={draft.credentials} onChange={(event) => set("credentials", event.target.value)} placeholder="DVM" />
            </ReviewerField>
            <ReviewerField label="Role" required error={errors.role}>
              <Input value={draft.role} onChange={(event) => set("role", event.target.value)} placeholder="Medical Reviewer" />
            </ReviewerField>
            <ReviewerField label="Profile slug" required error={errors.slug}>
              <Input value={draft.slug} onChange={(event) => set("slug", slugify(event.target.value))} placeholder="firstname-lastname" />
            </ReviewerField>
            <ReviewerField label="Profile image">
              <div className="rounded-xl border border-dashed border-[#BFD8CA] bg-[#F7FAF8] p-4">
                <div className="flex items-center gap-4">
                  <ReviewerAvatar reviewer={draft} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#102E24]">{draft.photoUrl ? "Profile image ready" : "Upload a profile image"}</p>
                    <p className="mt-1 text-xs leading-5 text-[#60736B]">JPEG, PNG, WebP, GIF, AVIF, or BMP. Use a clear square portrait.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#CFE2D7] bg-white px-4 text-sm font-semibold text-[#123B2D] transition hover:bg-[#F1F8F4]">
                    {imageUploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                    {imageUploadMutation.isPending ? "Uploading..." : draft.photoUrl ? "Replace image" : "Choose image"}
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="sr-only"
                      disabled={imageUploadMutation.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) imageUploadMutation.mutate(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {draft.photoUrl ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => set("photoUrl", null)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </ReviewerField>
            <ReviewerField label="Short biography" required error={errors.shortBio} className="md:col-span-2">
              <textarea className="min-h-32 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={draft.shortBio} onChange={(event) => set("shortBio", event.target.value)} placeholder="Introduce the veterinarian's experience and clinical interests." />
            </ReviewerField>
            <label className="flex items-center gap-3 rounded-lg border border-[#DDEBE2] bg-[#F7FAF8] p-4 md:col-span-2">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => set("isActive", event.target.checked)} className="h-4 w-4 accent-[#087C48]" />
              <span><span className="block font-bold text-[#102E24]">Available for article review</span><span className="mt-1 block text-sm text-[#60736B]">Inactive veterinarians remain on existing articles but cannot be assigned to new reviews.</span></span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#E5EEE8] pt-5">
            {selectedId ? <Button variant="outline" onClick={startNew}>Cancel editing</Button> : null}
            {selectedId && selected?.isActive ? (
              <Button
                type="button"
                variant="destructive"
                disabled={removeMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Remove ${selected.name} from future article reviews? Existing article attribution will remain.`)) {
                    removeMutation.mutate(selectedId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                {removeMutation.isPending ? "Removing..." : "Remove veterinarian"}
              </Button>
            ) : null}
            <Button onClick={save} disabled={saveMutation.isPending}><Stethoscope className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : selectedId ? "Save changes" : "Add veterinarian"}</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewerField({ label, required, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-bold uppercase text-[#587267]">{label}{required ? <span className="text-red-600"> *</span> : null}</span>
      {children}
      {error ? <span className="mt-2 block text-sm font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}
