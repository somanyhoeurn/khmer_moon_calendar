export const siteConfig = {
  name: "Khmer Moon Calendar",
  nameKm: "ប្រតិទិនចន្ទគតិខ្មែរ",
  tagline: "Preserving Khmer Time and Tradition",
  taglineKm: "ថែរក្សាពេលវេលា និងប្រពៃណីខ្មែរ",
  slug: "khmer-moon-calendar",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  timezone: "Asia/Phnom_Penh",
} as const;

/** Years for which the site publishes indexable calendar pages. */
export const INDEXED_YEARS = { from: 2024, to: 2027 } as const;
