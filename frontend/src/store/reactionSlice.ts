import { apiInstanceFetch } from './../util/ApiInstance';
import { setToast } from "@/util/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  reaction: any[];
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  reaction: [],
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
  reactionId: any;
  payload: any;
  formData: any;
}

export const getReaction: any = createAsyncThunk(
  "admin/reaction/fetchReaction",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`admin/reaction/fetchReaction`);
  }
);

export const createReaction = createAsyncThunk(
  "admin/reaction/addReaction",
  async (payload: AllUsersPayload | undefined) => {
    return axios.post("admin/reaction/addReaction", payload);
  }
);

export const deleteReaction = createAsyncThunk(
  "admin/reaction/removeReaction",
  async (payload: AllUsersPayload | undefined) => {
    return axios.delete(`admin/reaction/removeReaction?reactionId=${payload}`);
  }
);

export const activeReaction = createAsyncThunk(
  "admin/reaction/hasActiveReaction",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`admin/reaction/hasActiveReaction?reactionId=${payload}`);
  }
);

export const updateReaction: any = createAsyncThunk(
  "admin/reaction/modifyReaction",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/reaction/modifyReaction?reactionId=${payload?.id}`,
      payload
    );
  }
);

const reactionSlice = createSlice({
  name: "reaction",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getReaction.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
      state.isLoading = true
    });
    builder.addCase(
      getReaction.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.reaction = action.payload.data;
      state.isLoading = false

      }
    );
    builder.addCase(getReaction.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });

    builder.addCase(
      createReaction.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createReaction.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.reaction.unshift(action?.payload?.data?.data);

          setToast("success", "Reaction Add Successfully");
        }
      }
    );
    builder.addCase(createReaction.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteReaction.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteReaction.fulfilled, (state, action: any) => {
      if (action?.payload?.data?.status) {
        state.reaction = state.reaction.filter(
          (banner) => banner?._id !== action?.meta?.arg
        );
        setToast("success", "Reaction Delete Successfully");
      }
      state.isLoading = false;
    });

    builder.addCase(deleteReaction.rejected, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(
      activeReaction.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      activeReaction.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action?.payload?.data?.status) {
          const updatedBanner = action.payload.data.data;
          const bannerIndex = state.reaction.findIndex(
            (banner) => banner?._id === updatedBanner?._id
          );
          if (bannerIndex !== -1) {
            state.reaction[bannerIndex].isActive = updatedBanner.isActive;
          }
          setToast("success", "Reaction Status Update Successfully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(activeReaction.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(updateReaction.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateReaction.fulfilled, (state, action: any) => {
      state.isLoading = false;
      
      if (action.payload.status === true) {
        const bannerIndex = state.reaction.findIndex(
          (banner) => banner?._id === action?.payload?.data?._id
        );
        if (bannerIndex !== -1) {
          state.reaction[bannerIndex] = {
            ...state.reaction[bannerIndex],
            ...action.payload.data,
          };
        }
        setToast("success", `Reaction Updated Successfully`);
      }
    });

    builder.addCase(updateReaction.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default reactionSlice.reducer;
