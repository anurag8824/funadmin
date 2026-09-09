/**
 * Whitelist projection for ad settings exposed to mobile clients.
 * Never include payment keys, Firebase privateKey, or storage credentials.
 */
function getFileSetting() {
  try {
    delete require.cache[require.resolve("../setting")];
    return require("../setting");
  } catch {
    return {};
  }
}

function cleanId(val) {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (trimmed.toLowerCase().endsWith("_id")) return "";
  return trimmed;
}

function projectAdSetting(setting) {
  if (!setting) {
    return null;
  }

  const source = setting.toObject ? setting.toObject() : setting;
  const fileSetting = getFileSetting();

  const fileAndroid = fileSetting.android?.google || {};
  const fileIos = fileSetting.ios?.google || {};

  // If 0 or less, default to 10. Otherwise clamp to a floor of 5 so an admin
  // typo can't produce an ad-dense gap that reads as spammy / policy-risky.
  const parsedIndex = Number(source.adDisplayIndex);
  const finalDisplayIndex = (!parsedIndex || parsedIndex <= 0) ? 10 : Math.max(5, parsedIndex);

  return {
    isGoogle: Boolean(source.isGoogle !== undefined ? source.isGoogle : fileSetting.isGoogle),
    isFeedAdEnabled: Boolean(source.isFeedAdEnabled !== undefined ? source.isFeedAdEnabled : fileSetting.isFeedAdEnabled),
    isVideoAdEnabled: Boolean(source.isVideoAdEnabled !== undefined ? source.isVideoAdEnabled : fileSetting.isVideoAdEnabled),
    isChatAdEnabled: Boolean(source.isChatAdEnabled !== undefined ? source.isChatAdEnabled : fileSetting.isChatAdEnabled),
    isLiveStreamBackButtonAdEnabled: Boolean(source.isLiveStreamBackButtonAdEnabled !== undefined ? source.isLiveStreamBackButtonAdEnabled : fileSetting.isLiveStreamBackButtonAdEnabled),
    isChatBackButtonAdEnabled: Boolean(source.isChatBackButtonAdEnabled !== undefined ? source.isChatBackButtonAdEnabled : fileSetting.isChatBackButtonAdEnabled),
    adDisplayIndex: finalDisplayIndex,
    android: {
      google: {
        appId: cleanId(fileAndroid.appId || source.android?.google?.appId),
        banner: cleanId(fileAndroid.banner || source.android?.google?.banner),
        native: cleanId(fileAndroid.native || source.android?.google?.native),
        interstitial: cleanId(fileAndroid.interstitial || source.android?.google?.interstitial),
      },
    },
    ios: {
      google: {
        appId: cleanId(fileIos.appId || source.ios?.google?.appId),
        banner: cleanId(fileIos.banner || source.ios?.google?.banner),
        native: cleanId(fileIos.native || source.ios?.google?.native),
        interstitial: cleanId(fileIos.interstitial || source.ios?.google?.interstitial),
      },
    },
  };
}

module.exports = { projectAdSetting };
