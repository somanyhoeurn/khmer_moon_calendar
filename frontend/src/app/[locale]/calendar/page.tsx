import { connection } from "next/server";
import { phnomPenhToday } from "@/lib/api/server";
import { redirect } from "@/lib/i18n/navigation";

/** /calendar → the current Cambodian month at its stable URL. */
export default async function CalendarIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await connection();
  const today = phnomPenhToday();
  redirect({ href: `/calendar/${Number(today.slice(0, 4))}/${Number(today.slice(5, 7))}`, locale });
}
