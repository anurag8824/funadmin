import {
  ANDROID_PACKAGE_NAME,
  ANDROID_SHA256_FINGERPRINTS,
  IOS_BUNDLE_ID,
  IOS_TEAM_ID,
} from "./config";

export type AssetLinksDocument = Array<{
  relation: string[];
  target: {
    namespace: string;
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
}>;

export type AppleAppSiteAssociation = {
  applinks: {
    apps: string[];
    details: Array<{
      appID: string;
      paths: string[];
    }>;
  };
};

/** Android Digital Asset Links for funtapp.com App Links verification. */
export function buildAssetLinks(): AssetLinksDocument {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: ANDROID_SHA256_FINGERPRINTS,
      },
    },
  ];
}

/**
 * iOS Universal Links association file.
 * Paths must match AndroidManifest intent-filter pathPrefix values.
 */
export function buildAppleAppSiteAssociation(): AppleAppSiteAssociation {
  const details =
    IOS_TEAM_ID.length > 0
      ? [
          {
            appID: `${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`,
            paths: ["/post/*"],
          },
        ]
      : [];

  return {
    applinks: {
      apps: [],
      details,
    },
  };
}

export function isAssetLinksConfigured(): boolean {
  return ANDROID_SHA256_FINGERPRINTS.length > 0;
}

export function isUniversalLinksConfigured(): boolean {
  return IOS_TEAM_ID.length > 0;
}
