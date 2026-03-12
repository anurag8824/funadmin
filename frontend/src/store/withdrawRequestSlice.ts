import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface withdrawRequestState {
  pendingData: any[];
  totalPendingData: number;
  acceptedData: any[];
  totalAcceptedData: number;
  declinedData: any[];
  totalDeclinedData: number;
  isLoading: boolean;
}

const initialState: withdrawRequestState = {
  pendingData: [],
  totalPendingData: 0,
  acceptedData: [],
  totalAcceptedData: 0,
  declinedData: [],
  totalDeclinedData: 0,
  isLoading: false,
};

interface AllWithdrawPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  meta?: any;
  type?: any;
  reasonData?: string;
  withdrawRequestId?: string;
  data?: any;
  reason?: any;
}

export const getwithdrawRequest = createAsyncThunk(
  "admin/withdrawRequest/index",
  async (payload: AllWithdrawPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/withdrawRequest/index?start=${payload?.start}&limit=${payload?.limit}&type=${payload?.type}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

export const withdrawRequestAccept = createAsyncThunk(
  "admin/withdrawRequest/accept",
  async (payload: any) => {
    return axios.patch(`admin/withdrawRequest/accept?requestId=${payload}`);
  }
);

export const withdrawRequestDecline = createAsyncThunk(
  "admin/withdrawRequest/decline",
  async (payload: AllWithdrawPayload | undefined) => {
    return axios.patch(
      `admin/withdrawRequest/decline?requestId=${payload?.withdrawRequestId}&reason=${payload?.reason}`,
      payload?.data
    );
  }
);

const withdrawRequestReducer = createSlice({
  name: "withdrawRequest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getwithdrawRequest.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getwithdrawRequest.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllWithdrawPayload }>
      ) => {
        state.isLoading = false;
        if (action.meta.arg?.type === 1) {
          state.pendingData = action.payload.data;
          state.totalPendingData = action.payload.total;
        } else if (action.meta.arg?.type === 2) {
          state.acceptedData = action.payload.data;
          state.totalAcceptedData = action.payload.total;
        } else if (action.meta.arg?.type === 3) {
          state.declinedData = action.payload.data;
          state.totalDeclinedData = action.payload.total;
        }
      }
    );

    builder.addCase(
      getwithdrawRequest.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );
    builder.addCase(withdrawRequestAccept.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      withdrawRequestAccept.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllWithdrawPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.pendingData = state.pendingData.filter(
            (request) => request?._id !== action?.meta?.arg
          );
          setToast("success", `Withdraw Request Accepted Successfully`);
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(withdrawRequestAccept.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(withdrawRequestDecline.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      withdrawRequestDecline.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllWithdrawPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const deletedUserIds = action.meta.arg.withdrawRequestId;
          state.pendingData = state.pendingData.filter(
            (pending: any) => !deletedUserIds.includes(pending?._id)
          );
          setToast("success", ` Withdraw Request Declined Successfully`);
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(withdrawRequestDecline.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default withdrawRequestReducer.reducer;
