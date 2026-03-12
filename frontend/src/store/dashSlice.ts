import { apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  dashCount: Object;
  chartAnalyticOfUsers: any;
  chartAnalyticOfPosts: any;
  chartAnalyticOfVideos: any;
    activeUser : any;
  inActiveUser : any;
  totalUser : any;
  isLoading: boolean;
}

const initialState: UserState = {
  dashCount: {},
  chartAnalyticOfUsers: [],
  chartAnalyticOfPosts: [],
  chartAnalyticOfVideos: [],
    activeUser : 0,
  inActiveUser : 0,
  totalUser : 0,
  isLoading: false,
};

interface AllUsersPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}

export const dashboardCount = createAsyncThunk(
  "admin/dashboard/dashboardCount",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/dashboard/dashboardCount?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);
export const getChartUser = createAsyncThunk(
  "admin/dashboard/chartAnalytic/user",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/dashboard/chartAnalytic?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=User`
    );
  }
);
export const getChartPost = createAsyncThunk(
  "admin/dashboard/chartAnalytic/post",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/dashboard/chartAnalytic?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=Post`
    );
  }
);
export const getChartVideo = createAsyncThunk(
  "admin/dashboard/chartAnalytic/video",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/dashboard/chartAnalytic?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=Video`
    );
  }
);

export const getActiveInactiveUser = createAsyncThunk(
  "admin/dashboard/chartAnalyticOfUser/inactiveUser",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `admin/dashboard/chartAnalyticOfUser?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);
const dashSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      dashboardCount.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      dashboardCount.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.dashCount = action.payload.data;
      }
    );
    builder.addCase(
      dashboardCount.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      getChartPost.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      getChartPost.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.chartAnalyticOfPosts = action?.payload?.chartPost;
      }
    );
    builder.addCase(
      getChartPost.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );
    builder.addCase(
      getChartUser.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      getChartUser.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.chartAnalyticOfUsers = action?.payload?.chartUser;
      }
    );
    builder.addCase(
      getChartUser.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );
    builder.addCase(
      getChartVideo.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      getChartVideo.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.chartAnalyticOfVideos = action?.payload?.chartVideo;
      }
    );
    builder.addCase(
      getChartVideo.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

     builder.addCase(
          getActiveInactiveUser.pending,
          (state: any, action: PayloadAction<any>) => {
            state.isLoading = true;
          }
        );
        builder.addCase(
          getActiveInactiveUser.fulfilled,
          (state, action: PayloadAction<any>) => {
            state.isLoading = false;
            state.activeUser = action?.payload?.data?.activeUsers;
            state.inActiveUser = action?.payload?.data?.blockedUsers;
            state.totalUser = action?.payload?.data?.totalUsers
          }
        );
        builder.addCase(
          getActiveInactiveUser.rejected,
          (state: any, action: PayloadAction<any>) => {
    
            state.isLoading = false;
            setToast("error", action.payload?.data);
          }
        );
  },
});

export default dashSlice.reducer;
