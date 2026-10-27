import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <p className="text-6xl font-semibold text-gold" aria-hidden>
        ៤០៤
      </p>
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted">{t("notFoundBody")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
