/**
 * Whitelist projection for ad settings exposed to mobile clients.
 * Never include payment keys, Firebase privateKey, or storage credentials.
 */
function projectAdSetting(setting) {
  if (!setting) {
    return null;
  }

  const source = setting.toObject ? setting.toObject() : setting;

  return {
    isGoogle: Boolean(source.isGoogle),
    isFeedAdEnabled: Boolean(source.isFeedAdEnabled),
    isVideoAdEnabled: Boolean(source.isVideoAdEnabled),
    isChatAdEnabled: Boolean(source.isChatAdEnabled),
    isLiveStreamBackButtonAdEnabled: Boolean(source.isLiveStreamBackButtonAdEnabled),
    isChatBackButtonAdEnabled: Boolean(source.isChatBackButtonAdEnabled),
    adDisplayIndex: Number(source.adDisplayIndex) || 0,
    android: {
      google: {
        appId: source.android?.google?.appId || "",
        banner: source.android?.google?.banner || "",
        native: source.android?.google?.native || "",
        interstitial: source.android?.google?.interstitial || "",
      },
    },
    ios: {
      google: {
        appId: source.ios?.google?.appId || "",
        banner: source.ios?.google?.banner || "",
        native: source.ios?.google?.native || "",
        interstitial: source.ios?.google?.interstitial || "",
      },
    },
  };
}

module.exports = { projectAdSetting };
