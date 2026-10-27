"use client";

import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MAX_YEAR, MIN_YEAR, localizeNumber } from "@/lib/date/format";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function Stepper({
  id,
  label,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const numeric = Number(value);
  const step = (delta: number) => onChange(String(clamp((Number.isFinite(numeric) ? numeric : min) + delta, min, max)));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon-sm" className="rounded-full" onClick={() => step(-1)} disabled={numeric <= min} aria-label={decreaseLabel}>
          <Minus className="h-4 w-4" aria-hidden />
        </Button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(String(clamp(Number(value) || min, min, max)))}
          className="h-11 w-24 rounded-xl border border-border-strong bg-surface text-center text-lg text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button type="button" size="icon-sm" className="rounded-full" onClick={() => step(1)} disabled={numeric >= max} aria-label={increaseLabel}>
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** "Choose month and year" dialog (shadcn Dialog): month 1–12, year limited to the supported range. */
export function MonthYearPicker({
  year,
  month,
  onSave,
  children,
}: {
  year: number;
  month: number;
  onSave: (value: { year: number; month: number }) => void;
  /** The trigger's content (rendered inside a button). */
  children: ReactNode;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ month: String(month), year: String(year) });

  const onOpenChange = (next: boolean) => {
    if (next) setDraft({ month: String(month), year: String(year) });
    setOpen(next);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      month: clamp(Number(draft.month) || month, 1, 12),
      year: clamp(Number(draft.year) || year, MIN_YEAR, MAX_YEAR),
    });
    setOpen(false);
  };

  const range = (min: number, max: number) => `${localizeNumber(min, locale)}-${localizeNumber(max, locale)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg text-left hover:text-primary-hover">
        {children}
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <DialogTitle>{t("monthPicker")}</DialogTitle>
        <DialogDescription className="sr-only">{t("monthPickerHint", { min: MIN_YEAR, max: MAX_YEAR })}</DialogDescription>
        <form onSubmit={save} className="grid gap-6">
          <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
            <Stepper
              id="picker-month"
              label={`${t("month")} ${range(1, 12)}`}
              value={draft.month}
              min={1}
              max={12}
              onChange={(value) => setDraft((d) => ({ ...d, month: value }))}
              decreaseLabel={t("decrease", { field: t("month") })}
              increaseLabel={t("increase", { field: t("month") })}
            />
            <Stepper
              id="picker-year"
              label={`${t("year")} ${range(MIN_YEAR, MAX_YEAR)}`}
              value={draft.year}
              min={MIN_YEAR}
              max={MAX_YEAR}
              onChange={(value) => setDraft((d) => ({ ...d, year: value }))}
              decreaseLabel={t("decrease", { field: t("year") })}
              increaseLabel={t("increase", { field: t("year") })}
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full text-base">
            {t("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
