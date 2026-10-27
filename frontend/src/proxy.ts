import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

// Next.js 16 "proxy" (formerly middleware): adds the locale prefix and negotiates it.
export default createMiddleware(routing);

export const config = {
  // Skip API proxying, Next internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
