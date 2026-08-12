const AD_UNIT_ID_REGEX = /^ca-app-pub-\d+\/\d+$/;
const APP_ID_REGEX = /^ca-app-pub-\d+~\d+$/;
const PLACEHOLDER_SUFFIX = /_id$/i;

function isPlaceholder(value) {
  return !value || PLACEHOLDER_SUFFIX.test(String(value).trim());
}

function validateAdUnitId(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const trimmed = String(value).trim();
  if (isPlaceholder(trimmed)) {
    return `${fieldName} cannot be a placeholder value.`;
  }
  if (!AD_UNIT_ID_REGEX.test(trimmed)) {
    return `${fieldName} must match format ca-app-pub-XXXXXXXX/YYYYYYYYYY.`;
  }
  return null;
}

function validateAppId(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const trimmed = String(value).trim();
  if (isPlaceholder(trimmed)) {
    return `${fieldName} cannot be a placeholder value.`;
  }
  if (!APP_ID_REGEX.test(trimmed)) {
    return `${fieldName} must match format ca-app-pub-XXXXXXXX~YYYYYYYYYY.`;
  }
  return null;
}

/**
 * Validate ad-related fields from admin updateSetting body.
 * Returns the first error message or null if valid.
 */
function validateAdSettingPayload(body) {
  const checks = [
    validateAppId(body.androidGoogleAppId, "Android AdMob App ID"),
    validateAdUnitId(body.androidGoogleBanner, "Android Banner Unit ID"),
    validateAdUnitId(body.androidGoogleInterstitial, "Android Interstitial Unit ID"),
    validateAdUnitId(body.androidGoogleNative, "Android Native Unit ID"),
    validateAppId(body.iosGoogleAppId, "iOS AdMob App ID"),
    validateAdUnitId(body.iosGoogleBanner, "iOS Banner Unit ID"),
    validateAdUnitId(body.iosGoogleInterstitial, "iOS Interstitial Unit ID"),
    validateAdUnitId(body.iosGoogleNative, "iOS Native Unit ID"),
  ];

  return checks.find((error) => error !== null) || null;
}

module.exports = {
  validateAdUnitId,
  validateAppId,
  validateAdSettingPayload,
  AD_UNIT_ID_REGEX,
  APP_ID_REGEX,
};
