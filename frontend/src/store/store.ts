"use client";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import adminReducer from "./adminSlice";
import dialogReducer from "./dialogSlice";
import postReducer from "./postSlice";
import hashTagReducer from "./hashTagSlice";
import songReducer from "./songSlice";
import giftReducer from "./giftSlice";
import videoReducer from "./videoSlice";
import verificationRequestReducer from "./verificationRequestSlice";
import reportReducer from "./reportSlice";
import settingReducer from "./settingSlice";
import dashReducer from "./dashSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import currencySlice from "./currencySlice";
import coinPlanSlice from "./coinPlanSlice";
import withdrawRequestReducer from "./withdrawRequestSlice";
import bannerSlice from "./bannerSlice";
import reactionSlice from "./reactionSlice";
import liveVideoSlice from "./liveVideoSlice";
import supportRequestReducer from "./supportSlice";
import adminEaningSlice from "./adminEarningSlice";
import storySlice from "./storySlice";

export function makeStore() {
  return configureStore({
    reducer: {
      user: userReducer,
      admin: adminReducer,
      video: videoReducer,
      post: postReducer,
      gift: giftReducer,
      setting: settingReducer,
      song: songReducer,
      verificationRequest: verificationRequestReducer,
      report: reportReducer,
      hashTag: hashTagReducer,
      dialogue: dialogReducer,
      dashboard: dashReducer,
      currency: currencySlice,
      coinPlan: coinPlanSlice,
      withdrawRequest: withdrawRequestReducer,
      banner: bannerSlice,
      reaction: reactionSlice,
      support: supportRequestReducer,
      liveVideo: liveVideoSlice,
      adminEarning: adminEaningSlice,
      story: storySlice,
    },
  });
}
export const store = makeStore();

export type RootStore = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<any> = useSelector;
