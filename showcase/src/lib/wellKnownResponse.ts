import { NextResponse } from "next/server";

/** Serve JSON for Digital Asset Links / AASA without redirects. */
export function jsonWellKnown(body: unknown): NextResponse {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
