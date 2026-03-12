import { apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface hashTagState {
  pendingData: any[];
  totalPendingData: number;
  acceptedData: any[];
  totalAcceptedData: number;
  declinedData: any[];
  totalDeclinedData: number;
  isLoading: boolean;
}

const initialState: hashTagState = {
  pendingData: [],
  totalPendingData: 0,
  acceptedData: [],
  totalAcceptedData: 0,
  declinedData: [],
  totalDeclinedData: 0,
  isLoading: false,
};

interface AllHashTagPayload {
  start?: number;
  limit?: number;
  meta: any;
  type: string;
  reasonData: string;
  verificationRequestId?: string;
  data: any;
}

export const getVerificationRequest = createAsyncThunk(
  "admin/verificationRequest/getAll",
  async (payload: AllHashTagPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/verificationRequest/getAll?start=${payload?.start}&limit=${payload?.limit}&type=${payload?.type}`
    );
  }
);

export const verificationRequestAccept = createAsyncThunk(
  "admin/verificationRequest/verificationRequestAccept",
  async (payload: AllHashTagPayload | undefined) => {
    return axios.patch(
      `admin/verificationRequest/verificationRequestAccept?verificationRequestId=${payload}`
    );
  }
);

export const verificationRequestDecline = createAsyncThunk(
  "admin/verificationRequest/verificationRequestDecline",
  async (payload: AllHashTagPayload | undefined) => {
    return axios.patch(
      `admin/verificationRequest/verificationRequestDecline?verificationRequestId=${payload?.verificationRequestId}`,
      payload.data
    );
  }
);

const verificationRequestReducer = createSlice({
  name: "verificationRequest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getVerificationRequest.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getVerificationRequest.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        state.isLoading = false;
        if (action.meta.arg?.type === "pending") {
          state.pendingData = action.payload.data;
          state.totalPendingData = action.payload.data;
        } else if (action.meta.arg?.type === "accepted") {
          state.acceptedData = action.payload.data;
          state.totalAcceptedData = action.payload.data;
        } else if (action.meta.arg?.type === "declined") {
          state.declinedData = action.payload.data;
          state.totalDeclinedData = action.payload.data;
        }
      }
    );

    builder.addCase(
      getVerificationRequest.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );
    builder.addCase(verificationRequestAccept.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      verificationRequestAccept.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const deletedUserIds = action?.meta?.arg;
          state.pendingData = state?.pendingData?.filter(
            (pending: any) => pending?._id !== deletedUserIds
          );
          setToast("success", ` Verification Request Accepted Successfully`);
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(verificationRequestAccept.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(verificationRequestDecline.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      verificationRequestDecline.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const deletedUserIds = action.meta.arg.verificationRequestId;
          state.pendingData = state.pendingData.filter(
            (pending: any) => !deletedUserIds.includes(pending?._id)
          );
          setToast("success", ` Verification Request Declined Successfully`);
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(verificationRequestDecline.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default verificationRequestReducer.reducer;
