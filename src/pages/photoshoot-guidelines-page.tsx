import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  BookHeart,
  Clapperboard,
  FileStack,
  HandHeart,
  HeartPulse,
  Hospital,
  MapPinned,
  Printer,
  ShieldAlert,
  Sparkles,
  UsersRound
} from "lucide-react";
import { PhotoshootChecklistDrawer } from "@/components/brand-guide/photoshoot-checklist-drawer";
import { ShotCategoryCard } from "@/components/brand-guide/shot-category-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  assetGroups,
  clinicReadinessItems,
  consentPrivacyItems,
  deliverableGroups,
  photoshootShotCategories,
  shootDirectionBullets,
  stagedDataWarning,
  visualDirectionBullets,
  type PhotoshootChecklistId
} from "@/data/photoshoot-guidelines";

const iconMap = {
  sparkles: Sparkles,
  users: UsersRound,
  "heart-pulse": HeartPulse,
  "book-heart": BookHeart,
  siren: ShieldAlert,
  hospital: Hospital,
  "hand-heart": HandHeart,
  map: MapPinned,
  "file-stack": FileStack,
  clapperboard: Clapperboard
} as const;

function SectionHeading({
  label,
  title,
  description,
  action
}: {
  label: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#087C48]">{label}</p>
        <h2 className="text-[30px] font-black leading-[1.08] text-[#102E24] sm:text-[34px]">{title}</h2>
        <p className="text-sm font-medium leading-6 text-[#5F756C]">{description}</p>
      </div>
      {action ? <div className="photoshoot-no-print">{action}</div> : null}
    </div>
  );
}

function DetailListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="rounded-[24px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] shadow-soft">
      <CardContent className="p-6">
        <h3 className="text-lg font-extrabold text-[#102E24]">{title}</h3>
        <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-[#5F756C]">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#087C48]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function PhotoshootGuidelinesPage() {
  const [activeChecklistId, setActiveChecklistId] = useState<PhotoshootChecklistId | null>(null);
  const [restoreFocusElement, setRestoreFocusElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    document.body.classList.add("photoshoot-guide-print-context");

    return () => {
      document.body.classList.remove("photoshoot-guide-print-context");
    };
  }, []);

  function openChecklist(checklistId: PhotoshootChecklistId) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      setRestoreFocusElement(event.currentTarget);
      setActiveChecklistId(checklistId);
    };
  }

  function closeChecklist() {
    setActiveChecklistId(null);
  }

  function printGuide() {
    closeChecklist();
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <>
      <div className="photoshoot-print-page space-y-6">
        <PageHeader
          breadcrumb={["Brand Guide", "Photoshoot Guidelines"]}
          eyebrow="Brand Guide"
          title="Photoshoot Guidelines"
          description="Plan, coordinate, and track every required photo and video asset for Lili Veterinary Hospital."
          actions={
            <Button type="button" variant="outline" className="rounded-2xl border-[#DDEBE2] text-[#087C48]" onClick={printGuide}>
              <Printer className="h-4 w-4" />
              Print Guide
            </Button>
          }
        />

        <section className="rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,252,248,0.96))] p-6 shadow-soft-card sm:p-8">
          <SectionHeading
            label="Shoot Direction"
            title="What the photographer must understand"
            description="The shoot should present LiliVet as trusted, modern, warm, and medically capable. The final assets must support the rebrand, website, wellness plans, urgent care, Google Business Profile, and My Pet Diary."
            action={
              <Button type="button" className="rounded-2xl px-5" onClick={openChecklist("direction")}>
                Open Direction Checklist
              </Button>
            }
          />

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[24px] border border-[rgba(221,235,226,0.9)] bg-[#087C48] text-white shadow-green-glow">
              <CardContent className="p-6">
                <h3 className="text-[24px] font-extrabold leading-tight">Shoot Direction</h3>
                <ul className="mt-5 space-y-3 text-sm font-medium leading-6 text-white/88">
                  {shootDirectionBullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[24px] font-extrabold leading-tight text-[#102E24]">Visual Direction</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#5F756C]">
                      Keep the brand feeling premium, natural, and clinically calm.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="photoshoot-no-print rounded-2xl border-[#DDEBE2] text-[#087C48]"
                    onClick={openChecklist("visual")}
                  >
                    View Visual Checklist
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {visualDirectionBullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-[#DDEBE2] bg-[#FBFDFC] px-4 py-4 text-sm font-semibold leading-6 text-[#102E24]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card sm:p-8">
          <SectionHeading
            label="Shot Categories"
            title="Every campaign bucket has its own checklist"
            description="Use these cards to keep the production organized across hero imagery, clinic trust signals, wellness marketing, and short-form content."
            action={
              <Button type="button" className="rounded-2xl px-5" onClick={openChecklist("brand")}>
                Open Hero Checklist
              </Button>
            }
          />

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {photoshootShotCategories.map((category) => {
              const Icon = iconMap[category.icon];

              return (
                <ShotCategoryCard
                  key={category.id}
                  title={category.title}
                  description={category.description}
                  badge={category.badge}
                  icon={Icon}
                  onOpen={openChecklist(category.id)}
                />
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card sm:p-8">
          <SectionHeading
            label="Shoot Instructions"
            title="Prepare the clinic before cameras start rolling"
            description="Operational readiness and consent rules protect the brand, the team, and every pet-parent interaction."
            action={
              <Button type="button" className="rounded-2xl px-5" onClick={openChecklist("preparation")}>
                Open Preparation Checklist
              </Button>
            }
          />

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <DetailListCard title="Clinic Readiness" items={clinicReadinessItems} />
            <DetailListCard title="Consent and Privacy" items={consentPrivacyItems} />
          </div>

          <div className="mt-5 rounded-[24px] border border-[#F1D48B] bg-[#FFF8E3] px-5 py-5 text-sm font-semibold leading-6 text-[#6F4B00]">
            {stagedDataWarning}
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card sm:p-8">
          <SectionHeading
            label="Assets List"
            title="Prepare the branded items, props, and pet models in advance"
            description="The more intentional the asset prep, the more usable the final photography and video package will be."
            action={
              <Button type="button" className="rounded-2xl px-5" onClick={openChecklist("assets")}>
                Open Assets Checklist
              </Button>
            }
          />

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {assetGroups.map((group) => (
              <DetailListCard key={group.title} title={group.title} items={group.items} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[rgba(221,235,226,0.92)] bg-[rgba(255,255,255,0.96)] p-6 shadow-soft-card sm:p-8">
          <SectionHeading
            label="Final Deliverables"
            title="Set the minimum handoff before the shoot starts"
            description="The photographer and videographer should leave with a clear production target and a structured delivery expectation."
            action={
              <Button type="button" className="rounded-2xl px-5" onClick={openChecklist("deliverables")}>
                Open Deliverables Checklist
              </Button>
            }
          />

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {deliverableGroups.map((group) => (
              <DetailListCard key={group.title} title={group.title} items={group.items} />
            ))}
          </div>
        </section>
      </div>

      <PhotoshootChecklistDrawer
        checklistId={activeChecklistId}
        open={Boolean(activeChecklistId)}
        onClose={closeChecklist}
        onPrint={printGuide}
        restoreFocusElement={restoreFocusElement}
      />
    </>
  );
}
