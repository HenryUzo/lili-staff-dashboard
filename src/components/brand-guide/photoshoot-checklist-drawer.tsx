import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Printer, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getPhotoshootChecklistStorageKey,
  photoshootChecklistSections,
  type PhotoshootChecklistId,
  type PhotoshootChecklistSection
} from "@/data/photoshoot-guidelines";

interface PhotoshootChecklistDrawerProps {
  checklistId: PhotoshootChecklistId | null;
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
  restoreFocusElement?: HTMLElement | null;
}

function readStoredCompletion(id: PhotoshootChecklistId) {
  if (typeof window === "undefined") {
    return {} as Record<string, true>;
  }

  const storedValue = window.localStorage.getItem(getPhotoshootChecklistStorageKey(id));

  if (!storedValue) {
    return {} as Record<string, true>;
  }

  try {
    const parsed = JSON.parse(storedValue) as Record<string, boolean>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => value)) as Record<string, true>;
  } catch {
    return {} as Record<string, true>;
  }
}

function writeStoredCompletion(id: PhotoshootChecklistId, nextState: Record<string, true>) {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(nextState).length === 0) {
    window.localStorage.removeItem(getPhotoshootChecklistStorageKey(id));
    return;
  }

  window.localStorage.setItem(getPhotoshootChecklistStorageKey(id), JSON.stringify(nextState));
}

export function PhotoshootChecklistDrawer({
  checklistId,
  open,
  onClose,
  onPrint,
  restoreFocusElement
}: PhotoshootChecklistDrawerProps) {
  const [searchValue, setSearchValue] = useState("");
  const [completionStateByChecklist, setCompletionStateByChecklist] = useState<
    Partial<Record<PhotoshootChecklistId, Record<string, true>>>
  >({});
  const [hydratedChecklistIds, setHydratedChecklistIds] = useState<Partial<Record<PhotoshootChecklistId, true>>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const checklist = checklistId ? (photoshootChecklistSections[checklistId] as PhotoshootChecklistSection) : null;
  const completionState = checklistId ? completionStateByChecklist[checklistId] ?? {} : {};
  const hasHydrated = checklistId ? Boolean(hydratedChecklistIds[checklistId]) : false;

  useEffect(() => {
    if (!checklistId) {
      setSearchValue("");
      return;
    }

    setSearchValue("");
    setCompletionStateByChecklist((current) =>
      current[checklistId] ? current : { ...current, [checklistId]: readStoredCompletion(checklistId) }
    );
    setHydratedChecklistIds((current) => (current[checklistId] ? current : { ...current, [checklistId]: true }));
  }, [checklistId]);

  useEffect(() => {
    if (!checklistId || !hasHydrated) {
      return;
    }

    writeStoredCompletion(checklistId, completionState);
  }, [checklistId, completionState, hasHydrated]);

  const filteredItems = useMemo(() => {
    if (!checklist) {
      return [];
    }

    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return checklist.items;
    }

    return checklist.items.filter((item) =>
      `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query)
    );
  }, [checklist, searchValue]);

  const completedCount = checklist
    ? checklist.items.reduce((count, item) => count + (completionState[item.id] ? 1 : 0), 0)
    : 0;
  const totalCount = checklist?.items.length ?? 0;
  const completedPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  function toggleItem(itemId: string) {
    if (!checklistId) {
      return;
    }

    setCompletionStateByChecklist((current) => {
      const currentChecklistState = current[checklistId] ?? {};

      if (currentChecklistState[itemId]) {
        const nextState = { ...currentChecklistState };
        delete nextState[itemId];
        return { ...current, [checklistId]: nextState };
      }

      return {
        ...current,
        [checklistId]: { ...currentChecklistState, [itemId]: true }
      };
    });
  }

  function checkAllItems() {
    if (!checklist || !checklistId) {
      return;
    }

    const nextState = Object.fromEntries(checklist.items.map((item) => [item.id, true])) as Record<string, true>;
    setCompletionStateByChecklist((current) => ({ ...current, [checklistId]: nextState }));
  }

  function clearAllItems() {
    if (!checklistId) {
      return;
    }

    setCompletionStateByChecklist((current) => ({ ...current, [checklistId]: {} }));
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        overlayClassName="photoshoot-no-print"
        showCloseButton={false}
        aria-describedby={checklist ? "photoshoot-checklist-description" : undefined}
        className="photoshoot-no-print w-[min(560px,calc(100vw-24px))] rounded-[28px] border border-white/80 bg-white p-0 max-sm:inset-0 max-sm:w-full max-sm:rounded-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (!restoreFocusElement) {
            return;
          }

          event.preventDefault();
          restoreFocusElement.focus();
        }}
      >
        {checklist ? (
          <>
            <div className="border-b border-[#DDEBE2] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <DialogTitle className="text-[28px] font-extrabold leading-[1.05] text-[#102E24]">
                    {checklist.title}
                  </DialogTitle>
                  <DialogDescription
                    id="photoshoot-checklist-description"
                    className="max-w-[420px] text-sm font-medium leading-6 text-[#5F756C]"
                  >
                    {checklist.description}
                  </DialogDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Close checklist drawer"
                  className="h-11 w-11 rounded-full border-[#DDEBE2] text-[#5F756C]"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-[#5F756C]">
                  <span>{completedCount} completed</span>
                  <span>{completedPercent}% complete</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EAF7F0]">
                  <div
                    className="h-full rounded-full bg-[#087C48] transition-[width]"
                    style={{ width: `${completedPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87A89A]" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="h-12 rounded-2xl border-[#DDEBE2] bg-[#FBFDFC] pl-11 text-sm font-medium"
                    placeholder="Search checklist items"
                    aria-label="Search checklist items"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-[#DDEBE2] text-[#087C48]"
                    onClick={checkAllItems}
                  >
                    <Check className="h-4 w-4" />
                    Check All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-[#DDEBE2] text-[#087C48]"
                    onClick={clearAllItems}
                  >
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-[#DDEBE2] text-[#087C48]"
                    onClick={onPrint}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {filteredItems.length ? (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const checkboxId = `photoshoot-checklist-${item.id}`;

                    return (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-[#DDEBE2] bg-[#FBFDFC] px-4 py-4 transition hover:border-[#C6DDCF]"
                      >
                        <div className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3">
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={Boolean(completionState[item.id])}
                            onChange={() => toggleItem(item.id)}
                            className="mt-1 h-5 w-5 rounded border-[#BFD3C7] text-[#087C48] focus:ring-[#087C48]"
                          />
                          <label htmlFor={checkboxId} className="cursor-pointer">
                            <span className="block text-sm font-semibold leading-6 text-[#102E24]">{item.label}</span>
                            {item.description ? (
                              <span className="mt-1 block text-sm leading-6 text-[#5F756C]">{item.description}</span>
                            ) : null}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#DDEBE2] bg-[#FBFDFC] px-6 py-10 text-center text-sm font-medium leading-6 text-[#5F756C]">
                  No checklist items match this search.
                </div>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
