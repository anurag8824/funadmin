import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface VideoState {
  realStory: any[];
  totalRealStory: number;
  fakeStoryData: any[];
  userStoryData: any[];
  storyData: Object;
  totalFakeStory: 0;
  totalStory: 0;
  // totalStoryVideo: number;
  countryData: any[];
  isLoading: boolean;
}

const initialState: VideoState = {
  realStory: [],
  totalRealStory: 0,
  fakeStoryData: [],
  userStoryData: [],
  storyData: {},
  totalFakeStory: 0,
  totalStory: 0,
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
  userId?: string;
  storyId?: string;
  data: any;
  totalFakeStory: any;
  includeFake?: boolean;
}

export const allStory = createAsyncThunk(
  "admin/story/getAllStories",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/story/getAllStories?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&includeFake=${payload?.includeFake}`
    );
  }
);
export const allUserStory = createAsyncThunk(
  "admin/story/getAllStories1",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/story/getAllStories?includeFake=${payload?.includeFake}&userId=${payload?.userId}`
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

export const deleteFakeStory = createAsyncThunk(
  "admin/story/removeStory",
  async (payload: any) => {
    return apiInstanceFetch.delete(`admin/story/removeStory`, payload);
  }
);

export const addFakeStory = createAsyncThunk(
  "admin/story/uploadFakeStory",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.post(
      `admin/story/uploadFakeStory?userId=${payload?.fakeUserId}`,
      payload?.data
    );
  }
);

export const updateFakeStory = createAsyncThunk(
  "admin/story/updateFakeStory",
  async (payload: AllVideoPayload | undefined) => {
    return apiInstanceFetch.patch(
      // `admin/story/updateFakeStory?userId=${payload?.fakeUserId}&videoId=${payload?.id}`,
      `admin/story/updateFakeStory`,
      payload.data
    );
  }
);

const storyReducer = createSlice({
  name: "story",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allStory.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      allStory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        if (!action.meta.arg.includeFake) {
          state.realStory = action.payload.story;
          state.totalStory = action?.payload?.total;
        } else {
          state.fakeStoryData = action.payload.story;
          state.totalFakeStory = action?.payload?.total;
        }
        state.isLoading = false;
      }
    );

    builder.addCase(allStory.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });
    builder.addCase(
      allUserStory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      allUserStory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
          state.userStoryData = action.payload.story;
          // state.totalStory = action?.payload?.total;
        state.isLoading = false;
      }
    );
    builder.addCase(
      allUserStory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getUserVideo.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getUserVideo.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.userStoryData = action.payload?.data;
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
        state.storyData = action.payload?.data;
        state.isLoading = false;
      }
    );
    builder.addCase(
      deleteFakeStory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteFakeStory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        const deletedUserIds = action.meta.arg;
        state.isLoading = false;
        state.fakeStoryData = state.fakeStoryData.filter(
          (video: any) => video?._id !== deletedUserIds.storyId
        );

        state.realStory = state.realStory.filter(
          (video: any) => video?._id !== deletedUserIds.storyId
        );

        state.userStoryData = state.userStoryData.filter(
          (video: any) => video?._id !== deletedUserIds.storyId
        );
        setToast("success", " Video Delete Successfully");
      }
    );

    builder.addCase(
      deleteFakeStory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addFakeStory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addFakeStory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          state.fakeStoryData?.unshift(action?.payload?.data);
          setToast("success", `New Video Created`);
        }
      }
    );

    builder.addCase(addFakeStory.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateFakeStory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateFakeStory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllVideoPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const videoIndex = state.fakeStoryData.findIndex(
            (video) => video?._id === action?.payload?.fakeVideoOfUser?._id
          );
          if (videoIndex !== -1) {
            state.fakeStoryData[videoIndex] = {
              ...state.fakeStoryData[videoIndex],
              ...action.payload.fakeVideoOfUser,
            };
          }
          setToast("success", ` Video Update Successfully`);
        }
      }
    );

    builder.addCase(updateFakeStory.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default storyReducer.reducer;
