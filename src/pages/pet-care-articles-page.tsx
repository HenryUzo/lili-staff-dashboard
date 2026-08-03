import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BookOpenText, CheckCircle2, Eye, FileEdit, Plus, Search, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createPetCareArticle,
  getPetCareArticles,
  getPetCareReviewers,
  runPetCareArticleAction,
  updatePetCareArticle
} from "@/api/pet-care";
import { getErrorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PetCareArticle, PetCareArticleInput, PetCarePublishingStatus } from "@/types/api";

const statusLabels: Record<PetCarePublishingStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived"
};

const categories = [
  ["urgent-care", "Urgent Care"], ["dogs", "Dogs"], ["cats", "Cats"],
  ["puppy-kitten-care", "Puppy & Kitten Care"], ["preventive-care", "Preventive Care"],
  ["vaccinations", "Vaccinations"], ["dental-health", "Dental Health"],
  ["surgery-recovery", "Surgery & Recovery"], ["wellness-plans", "Wellness Plans"],
  ["seasonal-pet-safety", "Seasonal Pet Safety"]
] as const;

const blankArticle: PetCareArticleInput = {
  slug: "",
  title: "",
  seoTitle: "",
  seoDescription: "",
  excerpt: "",
  summary: "",
  categorySlug: "preventive-care",
  categoryLabel: "Preventive Care",
  tags: [],
  heroImageUrl: null,
  heroImageKey: null,
  heroImageFile: null,
  heroImageAlt: "",
  authorName: "Lili Veterinary Hospital Care Team",
  authorRole: "Veterinary Care Team",
  reviewerId: null,
  reviewDueAt: null,
  readingTimeMinutes: 5,
  relatedService: { title: "Book an Appointment", path: "/book-appointment" },
  relatedArticleSlugs: [],
  featured: false,
  seasonal: false,
  popular: false,
  keyTakeaways: [],
  monitorAtHome: [],
  warningCallout: null,
  vetQuote: null,
  faqs: [],
  references: [],
  sections: [{ id: "overview", title: "Overview", content: [""] }]
};

function articleToInput(article: PetCareArticle): PetCareArticleInput {
  const { id: _id, reviewer: _reviewer, status: _status, reviewStatus: _reviewStatus,
    reviewedAt: _reviewedAt, publishedAt: _publishedAt, createdAt: _createdAt,
    updatedAt: _updatedAt, ...input } = article;
  return input;
}

function StatusPill({ status }: { status: PetCarePublishingStatus }) {
  const tone = status === "PUBLISHED" ? "bg-[#E7F6ED] text-[#087C48]" :
    status === "IN_REVIEW" ? "bg-[#FFF3D9] text-[#8A5900]" :
    status === "APPROVED" ? "bg-[#EAF3FF] text-[#2673D9]" :
    status === "ARCHIVED" ? "bg-[#EEF1EF] text-[#60736B]" : "bg-[#F1E8FF] text-[#7040A8]";
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", tone)}>{statusLabels[status]}</span>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={cn("block", wide && "md:col-span-2")}><span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">{label}</span>{children}</label>;
}

function JsonField({ label, value, onChange, wide = false }: { label: string; value: unknown; onChange: (value: unknown) => void; wide?: boolean }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  return <Field label={label} wide={wide}><textarea value={text} onChange={(event) => {
    const next = event.target.value;
    setText(next);
    try { onChange(JSON.parse(next)); } catch { /* Keep draft text visible until valid JSON. */ }
  }} className="min-h-36 w-full rounded-lg border border-[#DDEBE2] bg-white px-3 py-3 font-mono text-xs outline-none focus:border-[#087C48]" /></Field>;
}

function ArticlePreview({ article }: { article: PetCareArticleInput }) {
  return <article className="mx-auto max-w-3xl py-5">
    <p className="text-xs font-bold uppercase text-[#087C48]">{article.categoryLabel}</p>
    <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#102E24]">{article.title || "Untitled article"}</h2>
    <p className="mt-4 text-lg leading-8 text-[#506B60]">{article.excerpt}</p>
    <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#60736B]"><span>{article.readingTimeMinutes} min read</span><span>/</span><span>{article.authorName}</span></div>
    {article.heroImageUrl ? <img src={article.heroImageUrl} alt={article.heroImageAlt} className="mt-8 aspect-[16/8] w-full rounded-lg object-cover" /> : null}
    <p className="mt-8 text-base leading-8 text-[#263D35]">{article.summary}</p>
    {article.sections.map((section) => <section key={section.id} className="mt-9"><h3 className="text-2xl font-extrabold text-[#102E24]">{section.title}</h3>{section.content.map((paragraph, index) => <p key={index} className="mt-3 leading-8 text-[#415D52]">{paragraph}</p>)}</section>)}
  </article>;
}

export function PetCareArticlesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PetCarePublishingStatus | "ALL">("ALL");
  const [staleOnly, setStaleOnly] = useState(false);
  const [draft, setDraft] = useState<PetCareArticleInput>(blankArticle);

  const articlesQuery = useQuery({ queryKey: ["pet-care-articles", status, staleOnly, search], queryFn: () => getPetCareArticles({ status, stale: staleOnly, search }) });
  const reviewersQuery = useQuery({ queryKey: ["pet-care-reviewers"], queryFn: getPetCareReviewers });
  const selected = useMemo(() => articlesQuery.data?.find((item) => item.id === selectedId) ?? null, [articlesQuery.data, selectedId]);

  useEffect(() => { if (selected) { setDraft(articleToInput(selected)); setIsCreating(false); } }, [selected]);
  useEffect(() => { if (!selectedId && articlesQuery.data?.length && !isCreating) setSelectedId(articlesQuery.data[0].id); }, [articlesQuery.data, isCreating, selectedId]);

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ["pet-care-articles"] });
  const saveMutation = useMutation({
    mutationFn: () => selected ? updatePetCareArticle(selected.id, draft) : createPetCareArticle(draft),
    onSuccess: async (article) => { toast.success(selected ? "Article saved" : "Draft created"); setSelectedId(article.id); setIsCreating(false); await refresh(); },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save article"))
  });
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "submit-review" | "approve" | "publish" | "archive" }) => runPetCareArticleAction(id, action),
    onSuccess: async () => { toast.success("Article status updated"); await refresh(); },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update article status"))
  });

  const set = <K extends keyof PetCareArticleInput>(key: K, value: PetCareArticleInput[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const currentStatus = selected?.status ?? "DRAFT";

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
      <div><p className="text-xs font-bold uppercase text-[#087C48]">Publishing</p><h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">Pet Care Library</h1><p className="mt-2 text-sm text-[#60736B]">Draft, medically review, publish, and keep care guidance current.</p></div>
      <Button onClick={() => { setDraft(blankArticle); setSelectedId(null); setIsCreating(true); setPreview(false); }}><Plus className="mr-2 h-4 w-4" />New article</Button>
    </header>

    <div className="grid min-h-[720px] gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-[18px] border border-[#DDEBE2] bg-white p-4">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[#789087]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles" className="pl-9" /></div>
        <div className="mt-3 grid grid-cols-2 gap-2"><Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><button type="button" onClick={() => setStaleOnly((value) => !value)} className={cn("rounded-lg border px-3 text-xs font-bold", staleOnly ? "border-[#B86A00] bg-[#FFF3D9] text-[#8A5900]" : "border-[#DDEBE2] text-[#506B60]")}>Review overdue</button></div>
        <div className="mt-4 space-y-2">{articlesQuery.isLoading ? <p className="p-4 text-sm text-[#60736B]">Loading articles...</p> : articlesQuery.data?.map((article) => <button key={article.id} onClick={() => { setSelectedId(article.id); setPreview(false); }} className={cn("w-full rounded-lg border p-3 text-left", selectedId === article.id ? "border-[#087C48] bg-[#F2FAF5]" : "border-[#E5EEE8] hover:bg-[#F8FBF9]")}><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-bold text-[#102E24]">{article.title}</p><StatusPill status={article.status} /></div><p className="mt-2 text-xs text-[#60736B]">{article.categoryLabel} · {article.reviewer?.name ?? "No reviewer"}</p>{article.reviewDueAt && new Date(article.reviewDueAt) < new Date() ? <p className="mt-2 text-xs font-bold text-[#B55D00]">Medical review overdue</p> : null}</button>)}</div>
      </aside>

      <section className="min-w-0 rounded-[18px] border border-[#DDEBE2] bg-white">
        {!selected && !isCreating ? <div className="flex h-full min-h-96 flex-col items-center justify-center text-center"><BookOpenText className="h-10 w-10 text-[#8CAC9D]" /><p className="mt-3 font-bold">Select an article or create a draft.</p></div> : <>
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EEE8] bg-white px-5 py-4"><div className="flex items-center gap-3"><StatusPill status={currentStatus} /><span className="text-xs font-semibold text-[#60736B]">{selected?.reviewStatus.replace(/_/g, " ") ?? "NOT REVIEWED"}</span></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPreview((value) => !value)}>{preview ? <FileEdit className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{preview ? "Edit" : "Preview"}</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || currentStatus === "ARCHIVED"}>Save</Button></div></div>
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-5">{preview ? <ArticlePreview article={draft} /> : <div className="grid gap-5 md:grid-cols-2">
            <Field label="Article title" wide><Input value={draft.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Slug"><Input value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field>
            <Field label="Category"><Select value={draft.categorySlug} onChange={(e) => { const category = categories.find(([slug]) => slug === e.target.value)!; setDraft((current) => ({ ...current, categorySlug: category[0], categoryLabel: category[1] })); }}>{categories.map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}</Select></Field>
            <Field label="SEO title" wide><Input value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /><span className="mt-1 block text-xs text-[#789087]">{draft.seoTitle.length}/70</span></Field>
            <Field label="Meta description" wide><textarea value={draft.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className="min-h-24 w-full rounded-lg border border-[#DDEBE2] p-3" /><span className="text-xs text-[#789087]">{draft.seoDescription.length}/170</span></Field>
            <Field label="Excerpt" wide><textarea value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} className="min-h-24 w-full rounded-lg border border-[#DDEBE2] p-3" /></Field>
            <Field label="Summary" wide><textarea value={draft.summary} onChange={(e) => set("summary", e.target.value)} className="min-h-28 w-full rounded-lg border border-[#DDEBE2] p-3" /></Field>
            <Field label="Reviewer"><Select value={draft.reviewerId ?? ""} onChange={(e) => set("reviewerId", e.target.value || null)}><option value="">Assign reviewer</option>{reviewersQuery.data?.filter((item) => item.isActive).map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{reviewer.name}, {reviewer.credentials}</option>)}</Select></Field>
            <Field label="Reading time"><Input type="number" min={1} value={draft.readingTimeMinutes} onChange={(e) => set("readingTimeMinutes", Number(e.target.value))} /></Field>
            <Field label="Hero image URL" wide><Input value={draft.heroImageUrl ?? ""} onChange={(e) => set("heroImageUrl", e.target.value || null)} placeholder="https://... (existing seeded image references remain supported)" /></Field>
            <Field label="Hero image alt text" wide><Input value={draft.heroImageAlt} onChange={(e) => set("heroImageAlt", e.target.value)} /></Field>
            <Field label="Tags (comma separated)" wide><Input value={draft.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></Field>
            <JsonField label="Article sections" value={draft.sections} onChange={(value) => set("sections", value as PetCareArticleInput["sections"])} wide />
            <JsonField label="Key takeaways" value={draft.keyTakeaways} onChange={(value) => set("keyTakeaways", value as string[])} />
            <JsonField label="Monitor at home" value={draft.monitorAtHome} onChange={(value) => set("monitorAtHome", value as string[])} />
            <JsonField label="FAQs" value={draft.faqs} onChange={(value) => set("faqs", value as PetCareArticleInput["faqs"])} />
            <JsonField label="References" value={draft.references} onChange={(value) => set("references", value as PetCareArticleInput["references"])} />
            <JsonField label="Related service" value={draft.relatedService} onChange={(value) => set("relatedService", value as PetCareArticleInput["relatedService"])} />
            <Field label="Related article slugs"><Input value={draft.relatedArticleSlugs.join(", ")} onChange={(e) => set("relatedArticleSlugs", e.target.value.split(",").map((slug) => slug.trim()).filter(Boolean))} /></Field>
            <Field label="Warning callout" wide><textarea value={draft.warningCallout ?? ""} onChange={(e) => set("warningCallout", e.target.value || null)} className="min-h-20 w-full rounded-lg border border-[#DDEBE2] p-3" /></Field>
            <Field label="Veterinarian quote" wide><textarea value={draft.vetQuote ?? ""} onChange={(e) => set("vetQuote", e.target.value || null)} className="min-h-20 w-full rounded-lg border border-[#DDEBE2] p-3" /></Field>
            <div className="flex flex-wrap gap-5 md:col-span-2">{(["featured", "popular", "seasonal"] as const).map((key) => <label key={key} className="flex items-center gap-2 text-sm font-bold capitalize"><input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} />{key}</label>)}</div>
          </div>}</div>
          {selected ? <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E5EEE8] p-4">{selected.status === "DRAFT" ? <Button variant="outline" onClick={() => actionMutation.mutate({ id: selected.id, action: "submit-review" })}><Send className="mr-2 h-4 w-4" />Submit for review</Button> : null}{selected.status === "IN_REVIEW" ? <Button onClick={() => actionMutation.mutate({ id: selected.id, action: "approve" })}><CheckCircle2 className="mr-2 h-4 w-4" />Approve medical review</Button> : null}{selected.status === "APPROVED" ? <Button onClick={() => actionMutation.mutate({ id: selected.id, action: "publish" })}><Upload className="mr-2 h-4 w-4" />Publish</Button> : null}{selected.status !== "ARCHIVED" ? <Button variant="outline" onClick={() => actionMutation.mutate({ id: selected.id, action: "archive" })}><Archive className="mr-2 h-4 w-4" />Archive</Button> : null}</footer> : null}
        </>}
      </section>
    </div>
  </div>;
}
