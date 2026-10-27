import { z } from "zod";
import { LUNAR_MONTH_IDS } from "@/types/api";

/** Error messages are translation keys under `converter.errors`. */
export const gregorianSchema = z.object({
  date: z
    .string()
    .min(1, "required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate")
    .refine((value) => {
      const [y, m, d] = value.split("-").map(Number);
      const parsed = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 0));
      return parsed.getUTCFullYear() === y && parsed.getUTCMonth() + 1 === m && parsed.getUTCDate() === d;
    }, "invalidDate")
    .refine((value) => value >= "2000-01-01" && value <= "2030-12-31", "outOfRange"),
});

export const lunarSchema = z.object({
  year: z.coerce.number({ message: "required" }).int().min(2543, "yearRange").max(2574, "yearRange"),
  month: z.enum(LUNAR_MONTH_IDS, { message: "required" }),
  day: z.coerce.number({ message: "required" }).int().min(1, "dayRange").max(15, "dayRange"),
  phase: z.enum(["waxing", "waning"], { message: "required" }),
});

export type GregorianForm = z.infer<typeof gregorianSchema>;
export type LunarFormInput = z.input<typeof lunarSchema>;
export type LunarForm = z.output<typeof lunarSchema>;
