import { buildAppleAppSiteAssociation } from "@/lib/appLinks";
import { jsonWellKnown } from "@/lib/wellKnownResponse";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return jsonWellKnown(buildAppleAppSiteAssociation());
}
