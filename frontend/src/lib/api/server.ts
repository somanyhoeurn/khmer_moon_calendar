import "server-only";

/** Today's ISO date in Cambodia, used when the API is unreachable. */
export function phnomPenhToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Phnom_Penh" }).format(new Date());
}
