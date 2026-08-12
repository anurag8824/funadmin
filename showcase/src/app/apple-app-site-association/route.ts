import { buildAppleAppSiteAssociation } from "@/lib/appLinks";
import { jsonWellKnown } from "@/lib/wellKnownResponse";

export const dynamic = "force-static";
export const revalidate = 3600;

/** iOS also requests the AASA file from the domain root (no extension). */
export function GET() {
  return jsonWellKnown(buildAppleAppSiteAssociation());
}
