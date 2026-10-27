import Link from "next/link";

// Fallback for requests outside any locale (the proxy normally adds one).
export default function GlobalNotFound() {
  return (
    <html lang="km">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>រកមិនឃើញទំព័រ · Page not found</h1>
        <p>
          <Link href="/km">ត្រឡប់ទៅទំព័រដើម</Link> · <Link href="/en">Back to home</Link>
        </p>
      </body>
    </html>
  );
}
