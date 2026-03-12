import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface VideoState {
  realVideo: any[];
  totalRealVideo: number;
  fakeVideoData: any[];
  userVideoData: any[];
  videoData: Object;

  totalFakeVideo: number;
  countryData: any[];
  isLoading: boolean;
}

const initialState: VideoState = {
  realVideo: [],
  totalRealVideo: 0,
  fakeVideoData: [],
  userVideoData: [],
  videoData: {},
  totalFakeVideo: 0,
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

export const getUserVideo: any = createAsyncThunk(
  "admin/user/getUserVideo?userId",
  async (payload: PayloadAction | undefined) => {
    return apiInstanceFetch.get(
      `admin/video/getVideosOfUser?userId=${payload}`
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

export const deleteFakeVideo = createAsyncThunk(
  "admin/video/deleteVideo?videoId",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/video/deleteVideo?videoId=${payload}`, {}
    );
  }
);

export const addFakeVideo = createAsyncThunk(
  "admin/video/uploadfakevideo",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.post(
      `admin/video/uploadfakevideo?userId=${payload?.fakeUserId}`,
      payload?.data
    );
  }
);

export const updateFakeVideo = createAsyncThunk(
  "admin/video/updatefakevideo",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/video/updatefakevideo?userId=${payload?.fakeUserId}&videoId=${payload?.id}`,
      payload.data
    );
  }
);

const videoReducer = createSlice({
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
      getUserVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getUserVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.userVideoData = action.payload?.data;
        state.isLoading = false;
      }
    );

    builder.addCase(
      getUserVideo.rejected,
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
      deleteFakeVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteFakeVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        const deletedUserIds = action.meta.arg;
        state.isLoading = false;
        state.fakeVideoData = state.fakeVideoData.filter(
          (video: any) => video?._id !== deletedUserIds
        );

        state.realVideo = state.realVideo.filter(
          (video: any) => video?._id !== deletedUserIds
        );

        state.userVideoData = state.userVideoData.filter(
          (video: any) => video?._id !== deletedUserIds
        );
        setToast("success", " Video Delete Successfully");
      }
    );

    builder.addCase(
      deleteFakeVideo.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addFakeVideo.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addFakeVideo.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          state.fakeVideoData?.unshift(action?.payload?.data);
          setToast("success", `New Video Created`);
        }
      }
    );

    builder.addCase(addFakeVideo.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateFakeVideo.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateFakeVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          
          const videoIndex = state.fakeVideoData.findIndex(
            (video) => video?._id === action?.payload?.fakeVideoOfUser?._id
          );
          if (videoIndex !== -1) {
            state.fakeVideoData[videoIndex] = {
              ...state.fakeVideoData[videoIndex],
              ...action.payload.fakeVideoOfUser,
            };
          }
          setToast("success", ` Video Update Successfully`);
        }
      }
    );

    builder.addCase(updateFakeVideo.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default videoReducer.reducer;
