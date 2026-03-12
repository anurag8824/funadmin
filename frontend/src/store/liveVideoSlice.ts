import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface VideoState {
  realVideo: any[];
  totalRealVideo: number;
  fakeVideoData: any[];
  liveVideoData: any[];
  videoData: Object;
  totalLiveVideo: number;
  totalFakeVideo: number;
  countryData: any[];
  isLoading: boolean;
}

const initialState: VideoState = {
  realVideo: [],
  totalRealVideo: 0,
  fakeVideoData: [],
  liveVideoData: [],
  videoData: {},
  totalFakeVideo: 0,
  totalLiveVideo: 0,
  countryData: [],
  isLoading: false,
};

interface AllVideoPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta: any;
  liveStreamMode?: any;
  videoId: string;
  fakeUserId: String;
  id?: string;
  data: any;
}

export const allVideo = createAsyncThunk(
  "admin/video/getVideos  ",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/video/getVideos?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`
    );
  }
);

export const getLiveVideo: any = createAsyncThunk(
  "admin/livevideo/getVideos",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/livevideo/getVideos?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}&liveStreamMode=${payload?.liveStreamMode}`
    );
  }
);

export const getVideoDetails: any = createAsyncThunk(
  "admin/user/getDetailOfVideo?videoId",
  async (payload: PayloadAction | undefined) => {
    return apiInstanceFetch.get(
      `admin/video/getDetailOfVideo?videoId=${payload}
`
    );
  }
);

export const deleteLiveFakeVideo = createAsyncThunk(
  "admin/liveVideo/deleteVideo?videoId",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/liveVideo/deleteVideo?videoId=${payload}`, {}
    );
  }
);

export const addLiveVideo = createAsyncThunk(
  "admin/livevideo/uploadLivevideo",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.post(`admin/livevideo/uploadLivevideo`, payload?.data);
  }
);

export const addPKLiveVideo = createAsyncThunk(
  "admin/livevideo/uploadLivevideo1",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.post(`admin/livevideo/uploadLivevideo`, payload?.data);
  }
);

export const updateLiveVideo = createAsyncThunk(
  "admin/video/updatefakevideo",
  async (payload: any | undefined) => {
    return apiInstanceFetch.patch(`admin/livevideo/updateLivevideo`, payload?.data);
  }
);

export const activeVideo = createAsyncThunk(
  "admin/livevideo/isLive",
  async (payload: AllVideoPayload | undefined) => {
    return axios.patch(`admin/livevideo/isLive?videoId=${payload}`);
  }
);

const liveVideoReducer = createSlice({
  name: "video",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allVideo.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      allVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        if (action.meta.arg.type === "realVideo") {
          state.realVideo = action.payload.videos;
          state.totalRealVideo = action?.payload?.totalVideo;
        } else {
          state.fakeVideoData = action.payload.videos;
          state.totalFakeVideo = action?.payload?.totalVideo;
        }
        state.isLoading = false;
      }
    );

    builder.addCase(allVideo.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });

    builder.addCase(
      getLiveVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getLiveVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.liveVideoData = action.payload?.data;
        state.totalLiveVideo = action?.payload?.total;
        state.isLoading = false;
      }
    );

    builder.addCase(
      getLiveVideo.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getVideoDetails.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getVideoDetails.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getVideoDetails.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.videoData = action.payload?.data;
        state.isLoading = false;
      }
    );

    builder.addCase(
      activeVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      activeVideo.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action?.payload?.data?.status) {
          const updateLiveVideo = action.payload.data.data;
          const liveVideoDataIndex = state.liveVideoData.findIndex(
            (liveVideoData) => liveVideoData?._id === updateLiveVideo?._id
          );

          if (liveVideoDataIndex !== -1) {
            state.liveVideoData[liveVideoDataIndex].isLive =
              updateLiveVideo?.isLive;
          }
          setToast("success", "Live Video Added Successfully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(activeVideo.rejected, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(
      deleteLiveFakeVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteLiveFakeVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        state.isLoading = false;
        
        if (action?.payload?.status === true) {
          
          const deletedUserIds = action.meta.arg;
          state.liveVideoData = state.liveVideoData.filter(
            (video: any) => video?._id !== deletedUserIds
          );
          setToast("success", " Video Delete Successfully");
        } else {
          setToast("error", action?.payload?.message);
        }
      }
    );

    builder.addCase(
      deleteLiveFakeVideo.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addLiveVideo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      addLiveVideo.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const newVideoData = {
            ...action.payload.data,
            name: action.payload.data.userId.name,
            userImage: action.payload.data.userId.image,
          };
          state.liveVideoData?.unshift(newVideoData);
          setToast("success", `New Video Created`);
        } else {
          setToast("error", action.payload.message);
        }
      }
    );

    builder.addCase(addLiveVideo.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(addPKLiveVideo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      addPKLiveVideo.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const newVideoData = {
            ...action.payload.data,
            name: action.payload.data.userId.name,
            userImage: action.payload.data.userId.image,
          };
          state.liveVideoData?.unshift(newVideoData);
          setToast("success", `New Video Created`);
        } else {
          setToast("error", action.payload.message);
        }
      }
    );

    builder.addCase(addPKLiveVideo.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateLiveVideo.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateLiveVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        state.isLoading = false;
        if (action?.payload?.status === true) {
          const videoIndex = state.liveVideoData.findIndex(
            (video) => video?._id === action?.payload?.data?._id
          );
          if (videoIndex !== -1) {
            state.liveVideoData[videoIndex] = {
              ...state.liveVideoData[videoIndex],
              ...action.payload.data,
            };
          }
          setToast("success", ` Video Update Successfully`);
        }
      }
    );

    builder.addCase(updateLiveVideo.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default liveVideoReducer.reducer;
