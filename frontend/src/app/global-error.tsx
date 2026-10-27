"use client";

// Last-resort boundary when the locale layout itself fails; must render its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="km">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>មានបញ្ហាកើតឡើង · Something went wrong</h1>
        <button type="button" onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          ព្យាយាមម្ដងទៀត · Try again
        </button>
      </body>
    </html>
  );
}
