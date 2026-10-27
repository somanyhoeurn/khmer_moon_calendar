import { BadgeCheck, Calculator, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Verification } from "@/types/api";

/** Makes the verification status of a lunar date explicit; calculated dates are never shown as confirmed. */
export function VerificationBadge({ verification, showHint = false }: { verification: Verification; showHint?: boolean }) {
  const t = useTranslations("verification");
  const source = verification.reference_source?.name ?? "";
  const hint =
    verification.status === "verified"
      ? t("verifiedHint", { source })
      : verification.status === "overridden"
        ? t("overriddenHint", { source, calculated: verification.calculated_lunar_date_en ?? "" })
        : t("calculatedHint");

  const icon =
    verification.status === "verified" ? (
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
    ) : verification.status === "overridden" ? (
      <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <Calculator className="h-3.5 w-3.5" aria-hidden />
    );

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Badge variant={verification.status === "calculated" ? "outline" : "sage"} title={hint}>
        {icon}
        {t(verification.status)}
      </Badge>
      {showHint && <span className="text-xs text-muted">{hint}</span>}
    </span>
  );
}
