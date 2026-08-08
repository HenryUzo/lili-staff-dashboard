import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  Copy,
  Eye,
  FileEdit,
  ImageUp,
  Loader2,
  MessageSquare,
  Mail,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPetCareArticle,
  createPetCarePreviewShare,
  getPetCareArticle,
  getPetCareArticles,
  getPetCareReviewers,
  runPetCareArticleAction,
  sendPetCareReviewInvitation,
  uploadPetCareHeroImage,
  updatePetCareArticle,
  updatePetCareReviewer,
} from "@/api/pet-care";
import { getErrorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  PetCareArticle,
  PetCareArticleInput,
  PetCarePublishingStatus,
} from "@/types/api";

type EditorTab = "content" | "seo" | "review" | "advanced";
const PUBLIC_SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.liliveterinaryhospital.com";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp";
const statusLabels: Record<PetCarePublishingStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Vet approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
const categories = [
  ["urgent-care", "Urgent Care"],
  ["dogs", "Dogs"],
  ["cats", "Cats"],
  ["puppy-kitten-care", "Puppy & Kitten Care"],
  ["preventive-care", "Preventive Care"],
  ["vaccinations", "Vaccinations"],
  ["dental-health", "Dental Health"],
  ["surgery-recovery", "Surgery & Recovery"],
  ["wellness-plans", "Wellness Plans"],
  ["seasonal-pet-safety", "Seasonal Pet Safety"],
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
  keyTakeaways: [""],
  monitorAtHome: [""],
  warningCallout: null,
  vetQuote: null,
  faqs: [],
  references: [],
  sections: [{ id: "overview", title: "Overview", content: [""] }],
};

interface ArticleFieldError {
  field: string;
  tab: EditorTab;
  message: string;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateArticleDraft(article: PetCareArticleInput): ArticleFieldError[] {
  const errors: ArticleFieldError[] = [];
  const add = (field: string, tab: EditorTab, message: string) =>
    errors.push({ field, tab, message });

  if (article.title.trim().length < 3) add("title", "content", "Enter at least 3 characters.");
  if (article.excerpt.trim().length < 20) add("excerpt", "content", "Enter at least 20 characters.");
  if (article.summary.trim().length < 20) add("summary", "content", "Enter at least 20 characters.");
  if (!article.heroImageUrl && !article.heroImageKey && !article.heroImageFile) {
    add("heroImage", "content", "Upload a hero image.");
  }
  if (article.heroImageAlt.trim().length < 5) {
    add("heroImageAlt", "content", "Describe the image using at least 5 characters.");
  }
  if (!Number.isInteger(article.readingTimeMinutes) || article.readingTimeMinutes < 1) {
    add("readingTimeMinutes", "content", "Enter a reading time of at least 1 minute.");
  }
  if (article.sections.length === 0) add("sections", "content", "Add at least one article section.");
  article.sections.forEach((section) => {
    if (!section.title.trim()) add(`section-title-${section.id}`, "content", "Enter a section heading.");
    if (section.type === "IMAGE") {
      if (!section.imageUrl) add(`section-image-${section.id}`, "content", "Upload a section image.");
      if ((section.imageAlt?.trim().length ?? 0) < 5) {
        add(`section-alt-${section.id}`, "content", "Describe the image using at least 5 characters.");
      }
    } else if (!section.content.length || section.content.some((item) => !item.trim())) {
      add(`section-content-${section.id}`, "content", "Enter section content.");
    }
  });
  if (article.keyTakeaways.some((item) => !item.trim())) {
    add("keyTakeaways", "content", "Complete or remove blank key takeaways.");
  }
  if (article.monitorAtHome.some((item) => !item.trim())) {
    add("monitorAtHome", "content", "Complete or remove blank monitoring items.");
  }
  if (article.faqs.some((faq) => !faq.question.trim() || !faq.answer.trim())) {
    add("faqs", "content", "Complete both the question and answer, or remove the blank FAQ.");
  }

  if (!slugPattern.test(article.slug) || article.slug.length < 2) {
    add("slug", "seo", "Use lowercase words separated by single hyphens.");
  }
  if (article.seoTitle.trim().length < 3 || article.seoTitle.length > 70) {
    add("seoTitle", "seo", "Use between 3 and 70 characters.");
  }
  if (article.seoDescription.trim().length < 20 || article.seoDescription.length > 170) {
    add("seoDescription", "seo", "Use between 20 and 170 characters.");
  }
  if (!article.relatedService.title.trim()) add("relatedServiceTitle", "seo", "Enter the related service name.");
  if (!article.relatedService.path.startsWith("/")) {
    add("relatedServicePath", "seo", "Enter a website path beginning with /.");
  }
  if (article.relatedArticleSlugs.some((slug) => !slugPattern.test(slug))) {
    add("relatedArticleSlugs", "seo", "Use lowercase article slugs separated by commas.");
  }
  if (article.references.some((reference) => !reference.label.trim())) {
    add("references", "seo", "Name every added reference or remove the blank reference.");
  }
  if (article.references.some((reference) => reference.url && !URL.canParse(reference.url))) {
    add("references", "seo", "Enter complete reference URLs beginning with https://.");
  }

  return errors;
}

function articleToInput(article: PetCareArticle): PetCareArticleInput {
  const {
    id: _id,
    reviewer: _reviewer,
    previewShares: _shares,
    status: _status,
    reviewStatus: _reviewStatus,
    reviewedAt: _reviewedAt,
    publishedAt: _publishedAt,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...input
  } = article;
  return input;
}

function StatusPill({ status }: { status: PetCarePublishingStatus }) {
  const tone =
    status === "PUBLISHED"
      ? "bg-[#E7F6ED] text-[#087C48]"
      : status === "IN_REVIEW"
        ? "bg-[#FFF3D9] text-[#8A5900]"
        : status === "APPROVED"
          ? "bg-[#EAF3FF] text-[#2673D9]"
          : status === "ARCHIVED"
            ? "bg-[#EEF1EF] text-[#60736B]"
            : "bg-[#F1E8FF] text-[#7040A8]";
  return (
    <span
      className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", tone)}
    >
      {statusLabels[status]}
    </span>
  );
}

function Field({
  label,
  help,
  children,
  wide = false,
  required = false,
  fieldId,
  error,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
  wide?: boolean;
  required?: boolean;
  fieldId?: string;
  error?: string;
}) {
  return (
    <label id={fieldId ? `field-${fieldId}` : undefined} className={cn("block", wide && "md:col-span-2")}>
      <span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">
        {label}
        {required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      {children}
      {help ? (
        <span className="mt-1.5 block text-xs text-[#789087]">{help}</span>
      ) : null}
      {error ? <span className="mt-1.5 block text-sm font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}

function StringListEditor({
  label,
  values,
  onChange,
  fieldId,
  error,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  fieldId?: string;
  error?: string;
}) {
  return (
    <div id={fieldId ? `field-${fieldId}` : undefined}>
      <p className="mb-2 text-xs font-bold uppercase text-[#60736B]">{label}</p>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(event) =>
                onChange(
                  values.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
            />
            <button
              type="button"
              aria-label={`Remove ${label} item`}
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
              className="rounded-lg border border-[#DDEBE2] px-3 text-[#60736B]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add item
      </Button>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

function JsonField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">
        {label}{required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          try {
            onChange(JSON.parse(event.target.value));
          } catch {
            /* Preserve incomplete JSON until valid. */
          }
        }}
        spellCheck={false}
        className="min-h-48 w-full rounded-lg border border-[#DDEBE2] bg-[#FAFCFA] p-3 font-mono text-xs leading-5 outline-none focus:border-[#087C48]"
      />
    </label>
  );
}

function ImageUploadControl({
  url,
  fileName,
  alt,
  pending,
  onSelect,
  onRemove,
}: {
  url?: string | null;
  fileName?: string | null;
  alt?: string | null;
  pending: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const fileInput = (
    <input
      type="file"
      accept={IMAGE_ACCEPT}
      className="sr-only"
      disabled={pending}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onSelect(file);
        event.target.value = "";
      }}
    />
  );

  if (!url) {
    return (
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#AFC9BA] bg-[#F7FAF8] px-5 text-center hover:border-[#087C48] hover:bg-[#F2FAF5]">
        {pending ? (
          <Loader2 className="h-7 w-7 animate-spin text-[#087C48]" />
        ) : (
          <ImageUp className="h-7 w-7 text-[#087C48]" />
        )}
        <strong className="mt-3 text-sm text-[#174C38]">
          {pending ? "Uploading image..." : "Choose image"}
        </strong>
        <span className="mt-1 text-xs text-[#60736B]">
          JPEG, PNG, WebP, GIF, AVIF, or BMP
        </span>
        {fileInput}
      </label>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#DDEBE2] bg-[#F7FAF8]">
      <img
        src={url}
        alt={alt || "Uploaded image preview"}
        className="aspect-[16/7] w-full object-cover"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <span className="truncate text-sm font-semibold text-[#415D52]">
          {fileName ?? "Uploaded image"}
        </span>
        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#CFE0D5] bg-white px-3 py-2 text-sm font-bold text-[#174C38] hover:bg-[#F2FAF5]">
            <ImageUp className="mr-2 h-4 w-4" /> Replace
            {fileInput}
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center rounded-lg border border-[#E6D7D7] px-3 py-2 text-sm font-bold text-[#8A3030]"
          >
            <X className="mr-2 h-4 w-4" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticlePreview({ article }: { article: PetCareArticleInput }) {
  return (
    <article className="mx-auto max-w-3xl py-5">
      <p className="text-xs font-bold uppercase text-[#087C48]">
        {article.categoryLabel}
      </p>
      <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#102E24]">
        {article.title || "Untitled article"}
      </h2>
      <p className="mt-4 text-lg leading-8 text-[#506B60]">{article.excerpt}</p>
      <div className="mt-5 flex gap-2 text-xs font-bold text-[#60736B]">
        <span>{article.readingTimeMinutes} min read</span>
        <span>/</span>
        <span>{article.authorName}</span>
      </div>
      {article.heroImageUrl ? (
        <img
          src={article.heroImageUrl}
          alt={article.heroImageAlt}
          className="mt-8 aspect-[16/8] w-full rounded-lg object-cover"
        />
      ) : null}
      <p className="mt-8 leading-8 text-[#263D35]">{article.summary}</p>
      {article.sections.map((section) => (
        <section key={section.id} className="mt-9">
          <h3 className="text-2xl font-extrabold">{section.title}</h3>
          {section.type === "IMAGE" && section.imageUrl ? (
            <figure className="mt-4">
              <img
                src={section.imageUrl}
                alt={section.imageAlt ?? ""}
                className="max-h-[620px] w-full rounded-lg object-cover"
              />
              {section.caption ? (
                <figcaption className="mt-2 text-sm text-[#60736B]">
                  {section.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : (
            section.content.map((paragraph, index) => (
              <p key={index} className="mt-3 leading-8 text-[#415D52]">
                {paragraph}
              </p>
            ))
          )}
        </section>
      ))}
    </article>
  );
}

export function PetCareArticlesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { articleId } = useParams<{ articleId: string }>();
  const isLibrary = !articleId && !location.pathname.endsWith("/new");
  const isCreating = location.pathname.endsWith("/new");
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState<EditorTab>("content");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PetCarePublishingStatus | "ALL">("ALL");
  const [staleOnly, setStaleOnly] = useState(false);
  const [draft, setDraft] = useState<PetCareArticleInput>(blankArticle);
  const [invalidImageSectionId, setInvalidImageSectionId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reviewerEmail, setReviewerEmail] = useState("");
  const articlesQuery = useQuery({
    queryKey: ["pet-care-articles", status, staleOnly, search],
    queryFn: () => getPetCareArticles({ status, stale: staleOnly, search }),
  });
  const articleQuery = useQuery({
    queryKey: ["pet-care-article", articleId],
    queryFn: () => getPetCareArticle(articleId!),
    enabled: Boolean(articleId),
  });
  const reviewersQuery = useQuery({
    queryKey: ["pet-care-reviewers"],
    queryFn: getPetCareReviewers,
  });
  const selected = articleQuery.data ?? null;
  const assignedReviewer = reviewersQuery.data?.find((reviewer) => reviewer.id === draft.reviewerId) ?? null;
  useEffect(() => {
    setReviewerEmail(assignedReviewer?.email ?? "");
  }, [assignedReviewer?.id, assignedReviewer?.email]);
  useEffect(() => {
    if (selected) {
      setDraft(articleToInput(selected));
    }
  }, [selected]);
  useEffect(() => {
    if (isCreating) {
      setDraft(blankArticle);
      setPreview(false);
      setTab("content");
    }
  }, [isCreating]);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pet-care-articles"] }),
      queryClient.invalidateQueries({ queryKey: ["pet-care-article", articleId] }),
    ]);
  const prepareDraft = () => ({
      ...draft,
      keyTakeaways: draft.keyTakeaways.map((item) => item.trim()).filter(Boolean),
      monitorAtHome: draft.monitorAtHome.map((item) => item.trim()).filter(Boolean),
    });
  const showValidationErrors = (preparedDraft: PetCareArticleInput) => {
    const validationErrors = validateArticleDraft(preparedDraft);
    const firstError = validationErrors[0];
    if (firstError) {
      setFieldErrors(Object.fromEntries(validationErrors.map((error) => [error.field, error.message])));
      const imageSection = preparedDraft.sections.find((section) =>
        [`section-image-${section.id}`, `section-alt-${section.id}`].includes(firstError.field),
      );
      setInvalidImageSectionId(imageSection?.id ?? null);
      setPreview(false);
      setTab(firstError.tab);
      toast.error(firstError.message);
      window.setTimeout(() => {
        document
          .getElementById(`field-${firstError.field}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return true;
    }

    setFieldErrors({});
    setInvalidImageSectionId(null);
    return false;
  };
  const saveDraft = () => {
    const preparedDraft = prepareDraft();
    if (showValidationErrors(preparedDraft)) return;
    setDraft(preparedDraft);
    saveMutation.mutate(preparedDraft);
  };
  const saveMutation = useMutation({
    mutationFn: (input: PetCareArticleInput) =>
      selected
        ? updatePetCareArticle(selected.id, input)
        : createPetCareArticle(input),
    onSuccess: async (article) => {
      toast.success(selected ? "Article saved" : "Draft created");
      await refresh();
      navigate(`/pet-care/${article.id}`, { replace: isCreating });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not save article")),
  });
  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "submit-review" | "publish" | "archive";
    }) => runPetCareArticleAction(id, action),
    onSuccess: async () => {
      toast.success("Article status updated");
      await refresh();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not update article status")),
  });
  const submitReviewMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PetCareArticleInput }) => {
      await updatePetCareArticle(id, input);
      return runPetCareArticleAction(id, "submit-review");
    },
    onSuccess: async () => {
      toast.success("Article saved and submitted for veterinary review");
      await refresh();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not submit article for review")),
  });
  const submitForReview = () => {
    if (!selected) return;
    const preparedDraft = prepareDraft();
    if (showValidationErrors(preparedDraft)) return;
    if (!preparedDraft.reviewerId) {
      setPreview(false);
      setTab("review");
      setFieldErrors((current) => ({ ...current, reviewerId: "Choose a veterinarian before submitting for review." }));
      toast.error("Choose a veterinarian before submitting for review.");
      window.setTimeout(() => {
        document.getElementById("field-reviewerId")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setFieldErrors((current) => {
      const { reviewerId: _reviewerError, ...remaining } = current;
      return remaining;
    });
    setDraft(preparedDraft);
    submitReviewMutation.mutate({ id: selected.id, input: preparedDraft });
  };
  const shareMutation = useMutation({
    mutationFn: ({
      id,
      shareType,
    }: {
      id: string;
      shareType: "COMMENT" | "REVIEWER";
    }) => createPetCarePreviewShare(id, shareType),
    onSuccess: async (share) => {
      const link = `${PUBLIC_SITE_URL}/pet-care/preview/${share.token}`;
      await navigator.clipboard.writeText(link);
      toast.success(
        share.shareType === "REVIEWER"
          ? "Veterinarian approval link copied"
          : "Comment preview link copied",
      );
      await refresh();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not create preview link")),
  });
  const reviewerEmailMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      updatePetCareReviewer(id, { email }),
    onSuccess: async () => {
      toast.success("Veterinarian email saved");
      await queryClient.invalidateQueries({ queryKey: ["pet-care-reviewers"] });
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save veterinarian email")),
  });
  const invitationMutation = useMutation({
    mutationFn: sendPetCareReviewInvitation,
    onSuccess: async (invitation) => {
      toast.success(`Review invitation sent to ${invitation.recipient}`);
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not send review invitation")),
  });
  const imageUploadMutation = useMutation({
    mutationFn: uploadPetCareHeroImage,
    onSuccess: (image) => {
      setDraft((current) => ({
        ...current,
        heroImageUrl: image.url,
        heroImageKey: null,
        heroImageFile: image.fileName,
      }));
      toast.success("Hero image uploaded");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not upload hero image")),
  });
  const sectionImageUploadMutation = useMutation({
    mutationFn: ({ file }: { sectionId: string; file: File }) =>
      uploadPetCareHeroImage(file),
    onSuccess: (image, { sectionId }) => {
      setDraft((current) => ({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                imageUrl: image.url,
              }
            : section,
        ),
      }));
      toast.success("Section image uploaded");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not upload section image")),
  });
  const set = <K extends keyof PetCareArticleInput>(
    key: K,
    value: PetCareArticleInput[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const currentStatus = selected?.status ?? "DRAFT";

  if (isLibrary) {
    return (
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
          <div>
            <p className="text-xs font-bold uppercase text-[#087C48]">
              Publishing
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">
              Pet Care Library
            </h1>
            <p className="mt-2 text-sm text-[#60736B]">
              Find, review, and manage every Pet Care article.
            </p>
          </div>
          <Button onClick={() => navigate("/pet-care/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New article
          </Button>
        </header>
        <section className="rounded-[18px] border border-[#DDEBE2] bg-white p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#789087]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search articles"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              <option value="ALL">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => setStaleOnly((value) => !value)}
              className={cn(
                "rounded-lg border px-3 text-xs font-bold",
                staleOnly
                  ? "border-[#B86A00] bg-[#FFF3D9] text-[#8A5900]"
                  : "border-[#DDEBE2] text-[#506B60]",
              )}
            >
              Review overdue
            </button>
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-[#E5EEE8]">
            <div className="hidden grid-cols-[minmax(0,1fr)_180px_150px_190px] gap-4 bg-[#F7FAF8] px-5 py-3 text-xs font-bold uppercase text-[#60736B] md:grid">
              <span>Article</span>
              <span>Category</span>
              <span>Status</span>
              <span>Veterinary reviewer</span>
            </div>
            {articlesQuery.isLoading ? (
              <p className="p-6 text-sm text-[#60736B]">Loading articles...</p>
            ) : articlesQuery.data?.length ? (
              articlesQuery.data.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => navigate(`/pet-care/${article.id}`)}
                  className="grid w-full gap-2 border-t border-[#E5EEE8] px-5 py-4 text-left first:border-t-0 hover:bg-[#F8FBF9] md:grid-cols-[minmax(0,1fr)_180px_150px_190px] md:items-center md:gap-4"
                >
                  <span>
                    <strong className="block text-sm text-[#102E24]">
                      {article.title}
                    </strong>
                    <span className="mt-1 block text-xs text-[#789087]">
                      Updated {new Date(article.updatedAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="text-sm text-[#506B60]">
                    {article.categoryLabel}
                  </span>
                  <span>
                    <StatusPill status={article.status} />
                  </span>
                  <span className="text-sm text-[#506B60]">
                    {article.reviewer?.name ?? "Not assigned"}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-10 text-center">
                <BookOpenText className="mx-auto h-9 w-9 text-[#8CAC9D]" />
                <p className="mt-3 font-bold">No articles match these filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#DDEBE2] bg-white px-7 py-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/pet-care")}
            className="flex items-center gap-2 text-sm font-bold text-[#087C48]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to articles
          </button>
          <h1 className="mt-2 text-3xl font-extrabold text-[#102E24]">
            {isCreating ? "Create Pet Care article" : selected?.title ?? "Article editor"}
          </h1>
          <p className="mt-2 text-sm text-[#60736B]">
            Edit content, configure search metadata, collect feedback, and publish after veterinary approval.
          </p>
        </div>
        <Button
          onClick={() => navigate("/pet-care/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          New article
        </Button>
      </header>
      <div className="grid min-h-[720px] gap-5">
        <aside className="hidden">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#789087]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles"
              className="pl-9"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              <option value="ALL">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => setStaleOnly((value) => !value)}
              className={cn(
                "rounded-lg border px-3 text-xs font-bold",
                staleOnly
                  ? "border-[#B86A00] bg-[#FFF3D9] text-[#8A5900]"
                  : "border-[#DDEBE2] text-[#506B60]",
              )}
            >
              Review overdue
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {articlesQuery.isLoading ? (
              <p className="p-4 text-sm text-[#60736B]">Loading articles...</p>
            ) : (
              articlesQuery.data?.map((article) => (
                <button
                  key={article.id}
                  onClick={() => navigate(`/pet-care/${article.id}`)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left",
                    articleId === article.id
                      ? "border-[#087C48] bg-[#F2FAF5]"
                      : "border-[#E5EEE8] hover:bg-[#F8FBF9]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-bold">
                      {article.title}
                    </p>
                    <StatusPill status={article.status} />
                  </div>
                  <p className="mt-2 text-xs text-[#60736B]">
                    {article.categoryLabel} /{" "}
                    {article.reviewer?.name ?? "No reviewer"}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>
        <section className="min-w-0 rounded-[18px] border border-[#DDEBE2] bg-white">
          {!selected && !isCreating ? (
            <div className="flex h-full min-h-96 flex-col items-center justify-center">
              <BookOpenText className="h-10 w-10 text-[#8CAC9D]" />
              <p className="mt-3 font-bold">
                Select an article or create a draft.
              </p>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 border-b border-[#E5EEE8] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <StatusPill status={currentStatus} />
                    <span className="text-xs font-semibold text-[#60736B]">
                      {selected?.reviewStatus.replace(/_/g, " ") ??
                        "NOT REVIEWED"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPreview((value) => !value)}
                    >
                      {preview ? (
                        <FileEdit className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {preview ? "Edit" : "Preview"}
                    </Button>
                    <Button
                      onClick={saveDraft}
                      disabled={
                        saveMutation.isPending || currentStatus === "ARCHIVED"
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
                {!preview ? (
                  <nav
                    className="flex gap-1 overflow-x-auto px-5"
                    aria-label="Article editor sections"
                  >
                    {(["content", "seo", "review", "advanced"] as EditorTab[]).map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTab(item)}
                          className={cn(
                            "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold capitalize",
                            tab === item
                              ? "border-[#087C48] text-[#087C48]"
                              : "border-transparent text-[#60736B]",
                          )}
                        >
                          {item === "review"
                            ? "Review & sharing"
                            : item === "advanced"
                              ? "Advanced settings"
                              : item}
                        </button>
                      ),
                    )}
                  </nav>
                ) : null}
              </div>
              <div className="max-h-[calc(100vh-270px)] overflow-y-auto p-5">
                {preview ? (
                  <ArticlePreview article={draft} />
                ) : tab === "content" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Article title" wide required fieldId="title" error={fieldErrors.title}>
                      <Input
                        aria-invalid={Boolean(fieldErrors.title)}
                        value={draft.title}
                        onChange={(e) => set("title", e.target.value)}
                      />
                    </Field>
                    <Field label="Category" required>
                      <Select
                        value={draft.categorySlug}
                        onChange={(e) => {
                          const category = categories.find(
                            ([slug]) => slug === e.target.value,
                          )!;
                          setDraft((current) => ({
                            ...current,
                            categorySlug: category[0],
                            categoryLabel: category[1],
                          }));
                        }}
                      >
                        {categories.map(([slug, label]) => (
                          <option key={slug} value={slug}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Reading time" required fieldId="readingTimeMinutes" error={fieldErrors.readingTimeMinutes}>
                      <Input
                        aria-invalid={Boolean(fieldErrors.readingTimeMinutes)}
                        type="number"
                        min={1}
                        value={draft.readingTimeMinutes}
                        onChange={(e) =>
                          set("readingTimeMinutes", Number(e.target.value))
                        }
                      />
                    </Field>
                    <Field
                      label="Short introduction"
                      wide
                      required
                      fieldId="excerpt"
                      error={fieldErrors.excerpt}
                      help="Shown on cards and beneath the headline."
                    >
                      <textarea
                        aria-invalid={Boolean(fieldErrors.excerpt)}
                        value={draft.excerpt}
                        onChange={(e) => set("excerpt", e.target.value)}
                        className="min-h-24 w-full rounded-lg border border-[#DDEBE2] p-3"
                      />
                    </Field>
                    <Field label="Article summary" wide required fieldId="summary" error={fieldErrors.summary}>
                      <textarea
                        aria-invalid={Boolean(fieldErrors.summary)}
                        value={draft.summary}
                        onChange={(e) => set("summary", e.target.value)}
                        className="min-h-28 w-full rounded-lg border border-[#DDEBE2] p-3"
                      />
                    </Field>
                    <div id="field-heroImage" className="md:col-span-2">
                      <span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">
                        Hero image <span className="text-red-600" aria-hidden="true">*</span>
                      </span>
                      <ImageUploadControl
                        url={draft.heroImageUrl}
                        fileName={draft.heroImageFile}
                        alt={draft.heroImageAlt}
                        pending={imageUploadMutation.isPending}
                        onSelect={(file) => imageUploadMutation.mutate(file)}
                        onRemove={() => {
                          set("heroImageUrl", null);
                          set("heroImageFile", null);
                        }}
                      />
                      <span className="mt-1.5 block text-xs text-[#789087]">
                        Use a clear landscape image with the subject near the
                        center.
                      </span>
                      {fieldErrors.heroImage ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors.heroImage}</p> : null}
                    </div>
                    <Field label="Image description" wide required fieldId="heroImageAlt" error={fieldErrors.heroImageAlt}>
                      <Input
                        aria-invalid={Boolean(fieldErrors.heroImageAlt)}
                        value={draft.heroImageAlt}
                        onChange={(e) => set("heroImageAlt", e.target.value)}
                      />
                    </Field>
                    <div id="field-sections" className="space-y-4 md:col-span-2">
                      <p className="text-xs font-bold uppercase text-[#60736B]">
                        Article sections <span className="text-red-600" aria-hidden="true">*</span>
                      </p>
                      {fieldErrors.sections ? <p className="text-sm font-semibold text-red-700">{fieldErrors.sections}</p> : null}
                      {draft.sections.map((section, index) =>
                        section.type === "IMAGE" ? (
                          <div
                            key={`${section.id}-${index}`}
                            id={`article-section-${section.id}`}
                            className={cn(
                              "rounded-lg border p-4",
                              invalidImageSectionId === section.id
                                ? "border-red-500 bg-red-50/40"
                                : "border-[#DDEBE2]",
                            )}
                          >
                            <p className="mb-2 text-xs font-bold uppercase text-[#60736B]">
                              Image section heading <span className="text-red-600" aria-hidden="true">*</span>
                            </p>
                            <div id={`field-section-title-${section.id}`} className="flex gap-2">
                              <Input
                                aria-invalid={Boolean(fieldErrors[`section-title-${section.id}`])}
                                value={section.title}
                                placeholder="Image section heading"
                                onChange={(event) =>
                                  set(
                                    "sections",
                                    draft.sections.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, title: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <button
                                type="button"
                                aria-label="Remove image section"
                                onClick={() =>
                                  set(
                                    "sections",
                                    draft.sections.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                                className="rounded-lg border px-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {fieldErrors[`section-title-${section.id}`] ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors[`section-title-${section.id}`]}</p> : null}
                            <p className="mb-2 mt-3 text-xs font-bold uppercase text-[#60736B]">
                              Section image <span className="text-red-600" aria-hidden="true">*</span>
                            </p>
                            <div id={`field-section-image-${section.id}`} className="mt-3">
                              <ImageUploadControl
                                url={section.imageUrl}
                                alt={section.imageAlt}
                                pending={
                                  sectionImageUploadMutation.isPending &&
                                  sectionImageUploadMutation.variables
                                    ?.sectionId === section.id
                                }
                                onSelect={(file) =>
                                  sectionImageUploadMutation.mutate({
                                    sectionId: section.id,
                                    file,
                                  })
                                }
                                onRemove={() =>
                                  set(
                                    "sections",
                                    draft.sections.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, imageUrl: null }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                            {fieldErrors[`section-image-${section.id}`] ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors[`section-image-${section.id}`]}</p> : null}
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <label id={`field-section-alt-${section.id}`}>
                                <span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">
                                  Image description <span className="text-red-600" aria-hidden="true">*</span>
                                </span>
                                <Input
                                  value={section.imageAlt ?? ""}
                                  aria-invalid={invalidImageSectionId === section.id}
                                  placeholder="Describe the image"
                                  onChange={(event) =>
                                    {
                                      const imageAlt = event.target.value;
                                      set(
                                        "sections",
                                        draft.sections.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? { ...item, imageAlt }
                                            : item,
                                        ),
                                      );
                                      if (imageAlt.trim().length >= 5) {
                                        setInvalidImageSectionId(null);
                                      }
                                    }
                                  }
                                />
                              </label>
                              <label>
                                <span className="mb-2 block text-xs font-bold uppercase text-[#60736B]">
                                  Caption <span className="normal-case font-normal">(optional)</span>
                                </span>
                                <Input
                                  value={section.caption ?? ""}
                                  placeholder="Image caption"
                                  onChange={(event) =>
                                    set(
                                      "sections",
                                      draft.sections.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              caption: event.target.value || null,
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                />
                              </label>
                            </div>
                            {fieldErrors[`section-alt-${section.id}`] ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors[`section-alt-${section.id}`]}</p> : null}
                            {invalidImageSectionId === section.id ? (
                              <p className="mt-2 text-sm font-semibold text-red-700">
                                {section.imageUrl
                                  ? "Describe what is shown in this image (at least 5 characters)."
                                  : "Upload an image before saving this section."}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                        <div
                          key={`${section.id}-${index}`}
                          className="rounded-lg border border-[#DDEBE2] p-4"
                        >
                          <p className="mb-2 text-xs font-bold uppercase text-[#60736B]">
                            Section heading <span className="text-red-600" aria-hidden="true">*</span>
                          </p>
                          <div id={`field-section-title-${section.id}`} className="flex gap-2">
                            <Input
                              aria-invalid={Boolean(fieldErrors[`section-title-${section.id}`])}
                              value={section.title}
                              placeholder="Section heading"
                              onChange={(e) =>
                                set(
                                  "sections",
                                  draft.sections.map((item, itemIndex) =>
                                    itemIndex === index
                                    ? {
                                        ...item,
                                        title: e.target.value,
                                      }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <button
                              type="button"
                              aria-label="Remove section"
                              onClick={() =>
                                set(
                                  "sections",
                                  draft.sections.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                              className="rounded-lg border px-3"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {fieldErrors[`section-title-${section.id}`] ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors[`section-title-${section.id}`]}</p> : null}
                          <p className="mb-2 mt-3 text-xs font-bold uppercase text-[#60736B]">
                            Section content <span className="text-red-600" aria-hidden="true">*</span>
                          </p>
                          <textarea
                            id={`field-section-content-${section.id}`}
                            aria-invalid={Boolean(fieldErrors[`section-content-${section.id}`])}
                            value={section.content.join("\n\n")}
                            onChange={(e) =>
                              set(
                                "sections",
                                draft.sections.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        content: e.target.value
                                          .split(/\n\s*\n/)
                                          .filter(Boolean),
                                      }
                                    : item,
                                ),
                              )
                            }
                            placeholder="Write the section body. Leave a blank line between paragraphs."
                            className="mt-3 min-h-36 w-full rounded-lg border border-[#DDEBE2] p-3"
                          />
                          {fieldErrors[`section-content-${section.id}`] ? <p className="mt-2 text-sm font-semibold text-red-700">{fieldErrors[`section-content-${section.id}`]}</p> : null}
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            set("sections", [
                              ...draft.sections,
                              {
                                id: `section-${draft.sections.length + 1}`,
                                title: "",
                                type: "CONTENT",
                                content: [""],
                              },
                            ])
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add section
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            set("sections", [
                              ...draft.sections,
                              {
                                id: `image-${Date.now()}`,
                                title: "Image",
                                type: "IMAGE",
                                content: [],
                                imageUrl: null,
                                imageAlt: "",
                                caption: null,
                              },
                            ])
                          }
                        >
                          <ImageUp className="mr-2 h-4 w-4" />
                          Add new image
                        </Button>
                      </div>
                    </div>
                    <StringListEditor
                      label="Key takeaways"
                      fieldId="keyTakeaways"
                      error={fieldErrors.keyTakeaways}
                      values={draft.keyTakeaways}
                      onChange={(values) => set("keyTakeaways", values)}
                    />
                    <StringListEditor
                      label="What to monitor at home"
                      fieldId="monitorAtHome"
                      error={fieldErrors.monitorAtHome}
                      values={draft.monitorAtHome}
                      onChange={(values) => set("monitorAtHome", values)}
                    />
                    <div id="field-faqs" className="space-y-3 md:col-span-2">
                      <p className="text-xs font-bold uppercase text-[#60736B]">
                        Frequently asked questions
                      </p>
                      {fieldErrors.faqs ? <p className="text-sm font-semibold text-red-700">{fieldErrors.faqs}</p> : null}
                      {draft.faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="grid gap-2 rounded-lg border border-[#DDEBE2] p-3 md:grid-cols-2"
                        >
                          <Input
                            value={faq.question}
                            placeholder="Question"
                            onChange={(e) =>
                              set(
                                "faqs",
                                draft.faqs.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, question: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                          <div className="flex gap-2">
                            <Input
                              value={faq.answer}
                              placeholder="Answer"
                              onChange={(e) =>
                                set(
                                  "faqs",
                                  draft.faqs.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, answer: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <button
                              type="button"
                              aria-label="Remove FAQ"
                              onClick={() =>
                                set(
                                  "faqs",
                                  draft.faqs.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                              className="rounded-lg border px-3"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          set("faqs", [
                            ...draft.faqs,
                            { question: "", answer: "" },
                          ])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add question
                      </Button>
                    </div>
                    <Field label="Warning callout" wide>
                      <textarea
                        value={draft.warningCallout ?? ""}
                        onChange={(e) =>
                          set("warningCallout", e.target.value || null)
                        }
                        className="min-h-20 w-full rounded-lg border border-[#DDEBE2] p-3"
                      />
                    </Field>
                    <Field label="Veterinarian quote" wide>
                      <textarea
                        value={draft.vetQuote ?? ""}
                        onChange={(e) =>
                          set("vetQuote", e.target.value || null)
                        }
                        className="min-h-20 w-full rounded-lg border border-[#DDEBE2] p-3"
                      />
                    </Field>
                  </div>
                ) : tab === "seo" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Page URL slug"
                      wide
                      required
                      fieldId="slug"
                      error={fieldErrors.slug}
                      help="Lowercase words separated with hyphens."
                    >
                      <Input
                        aria-invalid={Boolean(fieldErrors.slug)}
                        value={draft.slug}
                        onChange={(e) =>
                          set(
                            "slug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-"),
                          )
                        }
                      />
                    </Field>
                    <Field
                      label="SEO title"
                      wide
                      required
                      fieldId="seoTitle"
                      error={fieldErrors.seoTitle}
                      help={`${draft.seoTitle.length}/70 characters`}
                    >
                      <Input
                        aria-invalid={Boolean(fieldErrors.seoTitle)}
                        value={draft.seoTitle}
                        onChange={(e) => set("seoTitle", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Meta description"
                      wide
                      required
                      fieldId="seoDescription"
                      error={fieldErrors.seoDescription}
                      help={`${draft.seoDescription.length}/170 characters`}
                    >
                      <textarea
                        aria-invalid={Boolean(fieldErrors.seoDescription)}
                        value={draft.seoDescription}
                        onChange={(e) => set("seoDescription", e.target.value)}
                        className="min-h-24 w-full rounded-lg border border-[#DDEBE2] p-3"
                      />
                    </Field>
                    <Field
                      label="Search topics"
                      wide
                      help="Separate keywords with commas."
                    >
                      <Input
                        value={draft.tags.join(", ")}
                        onChange={(e) =>
                          set(
                            "tags",
                            e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </Field>
                    <Field label="Related service name" required fieldId="relatedServiceTitle" error={fieldErrors.relatedServiceTitle}>
                      <Input
                        aria-invalid={Boolean(fieldErrors.relatedServiceTitle)}
                        value={draft.relatedService.title}
                        onChange={(e) =>
                          set("relatedService", {
                            ...draft.relatedService,
                            title: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Related service path" required fieldId="relatedServicePath" error={fieldErrors.relatedServicePath}>
                      <Input
                        aria-invalid={Boolean(fieldErrors.relatedServicePath)}
                        value={draft.relatedService.path}
                        onChange={(e) =>
                          set("relatedService", {
                            ...draft.relatedService,
                            path: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Related article slugs" wide fieldId="relatedArticleSlugs" error={fieldErrors.relatedArticleSlugs}>
                      <Input
                        value={draft.relatedArticleSlugs.join(", ")}
                        onChange={(e) =>
                          set(
                            "relatedArticleSlugs",
                            e.target.value
                              .split(",")
                              .map((slug) => slug.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </Field>
                    <div id="field-references" className="space-y-3 md:col-span-2">
                      <p className="text-xs font-bold uppercase text-[#60736B]">
                        References
                      </p>
                      {fieldErrors.references ? <p className="text-sm font-semibold text-red-700">{fieldErrors.references}</p> : null}
                      {draft.references.map((reference, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-2">
                          <Input
                            value={reference.label}
                            placeholder="Source name"
                            onChange={(e) =>
                              set(
                                "references",
                                draft.references.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, label: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                          <div className="flex gap-2">
                            <Input
                              value={reference.url ?? ""}
                              placeholder="https://..."
                              onChange={(e) =>
                                set(
                                  "references",
                                  draft.references.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          url: e.target.value || undefined,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <button
                              type="button"
                              aria-label="Remove reference"
                              onClick={() =>
                                set(
                                  "references",
                                  draft.references.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                              className="rounded-lg border px-3"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          set("references", [
                            ...draft.references,
                            { label: "", url: "" },
                          ])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add reference
                      </Button>
                    </div>
                    <div className="flex gap-5 md:col-span-2">
                      {(["featured", "popular", "seasonal"] as const).map(
                        (key) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 text-sm font-bold capitalize"
                          >
                            <input
                              type="checkbox"
                              checked={draft[key]}
                              onChange={(e) => set(key, e.target.checked)}
                            />
                            {key}
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                ) : tab === "review" ? (
                  <div className="space-y-6">
                    <section className="rounded-lg border border-[#DDEBE2] p-5">
                      <h2 className="text-lg font-extrabold">
                        Veterinary review
                      </h2>
                      <p className="mt-1 text-sm text-[#60736B]">
                        A registered veterinarian must approve this article
                        before staff can publish it.
                      </p>
                      <Field
                        label="Assigned veterinarian"
                        required
                        fieldId="reviewerId"
                        error={fieldErrors.reviewerId}
                        help="Required before submitting for veterinary review. Current edits are saved automatically when you submit."
                      >
                        <Select
                          value={draft.reviewerId ?? ""}
                          aria-invalid={Boolean(fieldErrors.reviewerId)}
                          onChange={(e) => {
                            set("reviewerId", e.target.value || null);
                            if (e.target.value) {
                              setFieldErrors((current) => {
                                const { reviewerId: _reviewerError, ...remaining } = current;
                                return remaining;
                              });
                            }
                          }}
                        >
                          <option value="">Choose a veterinarian</option>
                          {reviewersQuery.data
                            ?.filter((item) => item.isActive)
                            .map((reviewer) => (
                              <option key={reviewer.id} value={reviewer.id}>
                                {reviewer.name}, {reviewer.credentials}
                              </option>
                            ))}
                        </Select>
                      </Field>
                      {assignedReviewer ? (
                        <div className="mt-4 rounded-lg border border-[#DDEBE2] bg-[#F7FAF8] p-4">
                          <label htmlFor="reviewer-email" className="text-sm font-bold text-[#274A3E]">
                            Veterinarian email <span className="text-red-600">*</span>
                          </label>
                          <p className="mt-1 text-xs text-[#60736B]">
                            The private approval invitation will be sent to this address.
                          </p>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                            <Input
                              id="reviewer-email"
                              type="email"
                              value={reviewerEmail}
                              placeholder="veterinarian@example.com"
                              onChange={(event) => setReviewerEmail(event.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              disabled={reviewerEmailMutation.isPending || !reviewerEmail.trim() || reviewerEmail === assignedReviewer.email}
                              onClick={() => reviewerEmailMutation.mutate({ id: assignedReviewer.id, email: reviewerEmail.trim() })}
                            >
                              {reviewerEmailMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Save email
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      {selected?.status === "IN_REVIEW" ? (
                        <div className="mt-4 space-y-3">
                          <div className="flex flex-wrap gap-3">
                            <Button
                              disabled={invitationMutation.isPending || !assignedReviewer?.email}
                              onClick={() => invitationMutation.mutate(selected.id)}
                            >
                              {invitationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                              Send review invitation
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => shareMutation.mutate({ id: selected.id, shareType: "REVIEWER" })}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy approval link
                            </Button>
                          </div>
                          {!assignedReviewer?.email ? (
                            <p className="text-sm font-semibold text-[#A33A2B]">Save the assigned veterinarian's email before sending.</p>
                          ) : null}
                          {selected.previewShares.find((share) => share.invitationSentAt) ? (
                            <p className="text-sm text-[#41695B]">
                              Last invitation sent to {selected.previewShares.find((share) => share.invitationSentAt)?.invitationRecipient} on {new Date(selected.previewShares.find((share) => share.invitationSentAt)!.invitationSentAt!).toLocaleString()}.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm font-semibold text-[#8A5900]">
                          Submit the article for review before creating the
                          veterinarian approval link.
                        </p>
                      )}
                    </section>
                    <section className="rounded-lg border border-[#DDEBE2] p-5">
                      <h2 className="text-lg font-extrabold">
                        Feedback preview
                      </h2>
                      <p className="mt-1 text-sm text-[#60736B]">
                        Create a private seven-day link so colleagues can read
                        the draft and leave comments.
                      </p>
                      {selected ? (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() =>
                            shareMutation.mutate({
                              id: selected.id,
                              shareType: "COMMENT",
                            })
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy comment link
                        </Button>
                      ) : (
                        <p className="mt-4 text-sm text-[#60736B]">
                          Save the draft first.
                        </p>
                      )}
                    </section>
                    <section>
                      <h2 className="flex items-center gap-2 text-lg font-extrabold">
                        <MessageSquare className="h-5 w-5" />
                        Comments
                      </h2>
                      <div className="mt-3 space-y-3">
                        {selected?.previewShares.flatMap(
                          (share) => share.comments,
                        ).length ? (
                          selected.previewShares
                            .flatMap((share) => share.comments)
                            .map((comment) => (
                              <article
                                key={comment.id}
                                className="rounded-lg border border-[#DDEBE2] p-4"
                              >
                                <div className="flex justify-between gap-3">
                                  <strong>{comment.authorName}</strong>
                                  <time className="text-xs text-[#789087]">
                                    {new Date(
                                      comment.createdAt,
                                    ).toLocaleString()}
                                  </time>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[#415D52]">
                                  {comment.comment}
                                </p>
                              </article>
                            ))
                        ) : (
                          <p className="rounded-lg bg-[#F7FAF8] p-4 text-sm text-[#60736B]">
                            No comments yet.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-[#E7D7A8] bg-[#FFF9E8] p-4">
                      <h2 className="font-extrabold text-[#5F4800]">
                        Advanced JSON settings
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[#725E20]">
                        These controls edit the same content shown in the simple
                        editor. Use them only for bulk or structured changes.
                        Invalid JSON is kept in the editor and is not saved to
                        the article.
                      </p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <JsonField
                        label="Sections"
                        required
                        value={draft.sections}
                        onChange={(value) =>
                          set("sections", value as PetCareArticleInput["sections"])
                        }
                      />
                      <JsonField
                        label="Key takeaways"
                        value={draft.keyTakeaways}
                        onChange={(value) =>
                          set(
                            "keyTakeaways",
                            value as PetCareArticleInput["keyTakeaways"],
                          )
                        }
                      />
                      <JsonField
                        label="Monitor at home"
                        value={draft.monitorAtHome}
                        onChange={(value) =>
                          set(
                            "monitorAtHome",
                            value as PetCareArticleInput["monitorAtHome"],
                          )
                        }
                      />
                      <JsonField
                        label="FAQs"
                        value={draft.faqs}
                        onChange={(value) =>
                          set("faqs", value as PetCareArticleInput["faqs"])
                        }
                      />
                      <JsonField
                        label="References"
                        value={draft.references}
                        onChange={(value) =>
                          set(
                            "references",
                            value as PetCareArticleInput["references"],
                          )
                        }
                      />
                      <JsonField
                        label="Related service"
                        required
                        value={draft.relatedService}
                        onChange={(value) =>
                          set(
                            "relatedService",
                            value as PetCareArticleInput["relatedService"],
                          )
                        }
                      />
                      <JsonField
                        label="Related article slugs"
                        value={draft.relatedArticleSlugs}
                        onChange={(value) =>
                          set(
                            "relatedArticleSlugs",
                            value as PetCareArticleInput["relatedArticleSlugs"],
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              {selected ? (
                <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E5EEE8] p-4">
                  {selected.status === "DRAFT" ? (
                    <Button
                      variant="outline"
                      onClick={submitForReview}
                      disabled={submitReviewMutation.isPending}
                    >
                      {submitReviewMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {submitReviewMutation.isPending ? "Saving and submitting..." : "Submit for review"}
                    </Button>
                  ) : null}
                  {selected.status === "APPROVED" ? (
                    <Button
                      onClick={() =>
                        actionMutation.mutate({
                          id: selected.id,
                          action: "publish",
                        })
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Publish approved article
                    </Button>
                  ) : null}
                  {selected.status !== "ARCHIVED" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        actionMutation.mutate({
                          id: selected.id,
                          action: "archive",
                        })
                      }
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  ) : null}
                </footer>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
