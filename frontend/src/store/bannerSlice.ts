import { apiInstanceFetch } from './../util/ApiInstance';
import { setToast } from "@/util/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  banner: any[];
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  banner: [],
  isLoading: false,
  isSkeleton: false,
};

interface AllUsersPayload {
  start?: number;
  limit?: number;
  search: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta?: any;
  id?: any;
  data: any;
  bannerId: any;
  payload: any;
  formData: any;
}

export const getBanner: any = createAsyncThunk(
  "admin/banner/getAll",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`admin/banner/getBanner`);
  }
);

export const createBanner = createAsyncThunk(
  "admin/banner/create",
  async (payload: AllUsersPayload | undefined) => {
    return axios.post("admin/banner/createBanner", payload);
  }
);

export const deleteBanner = createAsyncThunk(
  "admin/banner/delete",
  async (payload: AllUsersPayload | undefined) => {
    return axios.delete(`admin/banner/deleteBanner?bannerId=${payload}`);
  }
);

export const activeBanner = createAsyncThunk(
  "admin/banner/isActive",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`admin/banner/isActive?bannerId=${payload}`);
  }
);

export const updateBanner: any = createAsyncThunk(
  "admin/banner/updateBanner",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/banner/updateBanner?bannerId=${payload?.id}`,
      payload
    );
  }
);

const bannerSlice = createSlice({
  name: "banner",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBanner.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
      state.isLoading = true
    });
    builder.addCase(
      getBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.banner = action.payload.data;
      state.isLoading = false

      }
    );
    builder.addCase(getBanner.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });

    builder.addCase(
      createBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.banner.unshift(action?.payload?.data?.data);

          setToast("success", "Banner Add Successfully");
        }
      }
    );
    builder.addCase(createBanner.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteBanner.fulfilled, (state, action: any) => {
      if (action?.payload?.data?.status) {
        state.banner = state.banner.filter(
          (banner) => banner?._id !== action?.meta?.arg
        );
        setToast("success", "Banner Delete Successfully");
      }
      state.isLoading = false;
    });

    builder.addCase(deleteBanner.rejected, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(
      activeBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      activeBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action?.payload?.data?.status) {
          const updatedBanner = action.payload.data.data;
          const bannerIndex = state.banner.findIndex(
            (banner) => banner?._id === updatedBanner?._id
          );
          if (bannerIndex !== -1) {
            state.banner[bannerIndex].isActive = updatedBanner.isActive;
          }
          setToast("success", "Banner Status Update Successfully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(activeBanner.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(updateBanner.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateBanner.fulfilled, (state, action: any) => {
      state.isLoading = false;
      
      if (action.payload.status === true) {
        const bannerIndex = state.banner.findIndex(
          (banner) => banner?._id === action?.payload?.data?._id
        );
        if (bannerIndex !== -1) {
          state.banner[bannerIndex] = {
            ...state.banner[bannerIndex],
            ...action.payload.data,
          };
        }
        setToast("success", `Banner Updated Successfully`);
      }
    });

    builder.addCase(updateBanner.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default bannerSlice.reducer;
