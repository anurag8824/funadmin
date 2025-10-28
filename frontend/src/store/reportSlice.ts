import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface ReportState {
  videoReport: any[];
  postReport: any[];
  userReport: any[];
  totalUserReport: number;
  totalVideoReport: number;
  totalPostReport: number;
  isLoading: boolean;
}

const initialState: ReportState = {
  videoReport: [],
  postReport: [],
  userReport: [],
  totalUserReport: 0,
  totalVideoReport: 0,
  totalPostReport: 0,
  isLoading: false,
};

interface AllReportPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta: any;
  reportId: String;
  status: String;
  reportType: any;
  id?: string;
  data: any;
}

export const getReport = createAsyncThunk(
  "admin/report/getReports",
  async (payload: AllReportPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/report/getReports?start=${payload?.start}&limit=${payload?.limit}&type=${payload?.type}&status=${payload?.status}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

export const getPostReport = createAsyncThunk(
  "admin/report/postReports",
  async (payload: AllReportPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/report/postReports?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`
    );
  }
);

export const deleteReport = createAsyncThunk(
  "admin/report/deleteReport",
  async (payload: AllReportPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/report/deleteReport?reportId=${payload?.reportId}`, {}
    );
  }
);

export const solvedReport = createAsyncThunk(
  "admin/report/solveReport",
  async (payload: AllReportPayload | undefined) => {
    return axios.patch(
      `admin/report/solveReport?reportId=${payload?.reportId}`,
      payload.data
    );
  }
);

const reportReducer = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getReport.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
      state.userReport = [];
      state.videoReport = [];
      state.postReport = [];
      state.totalUserReport = 0;
      state.totalVideoReport = 0;
      state.totalPostReport = 0;
    });

    builder.addCase(
      getReport.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllReportPayload }>
      ) => {
        state.isLoading = false;
        (state.userReport = action.payload.data || state.userReport),
          (state.videoReport = action.payload.data || state.videoReport),
          (state.postReport = action.payload.data || state.postReport);

        state.totalUserReport = action.payload.total;
        state.totalVideoReport = action.payload.total;
        state.totalPostReport = action.payload.total;
      }
    );

    builder.addCase(getReport.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });
    builder.addCase(
      deleteReport.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteReport.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllReportPayload }>
      ) => {
        if (action.payload?.status === true) {
          if (action.meta.arg.reportType === 1) {
            const solvedReport = action.meta.arg?.reportId;
            state.videoReport = state.videoReport.filter(
              (report: any) => !solvedReport.includes(report?._id)
            );
          } else if (action.meta.arg.reportType === 2) {
            const solvedReport = action.meta.arg?.reportId;
            state.postReport = state.postReport.filter(
              (report: any) => !solvedReport.includes(report?._id)
            );
          } else if (action.meta.arg.reportType === 3) {
            const solvedReport = action.meta.arg?.reportId;
            state.userReport = state.userReport.filter(
              (report: any) => !solvedReport.includes(report?._id)
            );
          }
          setToast("success", " Report Delete Successfully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(
      deleteReport.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(solvedReport.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      solvedReport.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllReportPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          if (action.meta.arg.reportType == 1) {
            const reportIndex = state.videoReport.findIndex(
              (song) => song?._id === action.meta.arg?.reportId
            );
            if (reportIndex !== -1) {
              state.videoReport[reportIndex] = {
                ...state.videoReport[reportIndex],
                ...action.payload.data?.data,
              };
            }
          } else if (action.meta.arg.reportType == 2) {
            const reportIndex = state.postReport.findIndex(
              (song) => song?._id === action.meta.arg?.reportId
            );
            if (reportIndex !== -1) {
              state.postReport[reportIndex] = {
                ...state.postReport[reportIndex],
                ...action.payload.data?.data,
              };
            }
          } else if (action.meta.arg.reportType == 3) {
            const reportIndex = state.userReport.findIndex(
              (song) => song?._id === action.meta.arg?.reportId
            );
            if (reportIndex !== -1) {
              state.userReport[reportIndex] = {
                ...state.userReport[reportIndex],
                ...action.payload.data?.data,
              };
            }
          }
          setToast("success", ` Report Solved Successfully`);
        }
      }
    );

    builder.addCase(solvedReport.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default reportReducer.reducer;
