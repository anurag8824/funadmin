import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface supportRequestState {
    pendingData: any[];
    totalPendingData: number;
    acceptedData: any[];
    totalAcceptedData: number;
    declinedData: any[];
    totalDeclinedData: number;
    isLoading: boolean;
}

const initialState: supportRequestState = {
    pendingData: [],
    totalPendingData: 0,
    acceptedData: [],
    totalAcceptedData: 0,
    declinedData: [],
    totalDeclinedData: 0,   
    isLoading: false,
};

interface AllSupportPayload {
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
    status?: any
}

export const getSupportRequest = createAsyncThunk(
    "admin/complaint/getComplaints",
    async (payload: AllSupportPayload | undefined) => {
        try {
            const response = await apiInstanceFetch.get(
                `admin/complaint/getComplaints?status=${payload?.status}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
            );
            return response.data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
);


export const supportRequestAccept = createAsyncThunk(
    "admin/complaint/solveComplaint",
    async (payload: any) => {
        return axios.patch(`/admin/complaint/solveComplaint?complaintId=${payload}`);
    }
);

export const deleteSupportRequest = createAsyncThunk(
    "admin/complaint/deleteComplaint",
    async (payload: any) => {
        return apiInstanceFetch.delete(
            `admin/complaint/deleteComplaint?complaintId=${payload}`, {}
        );
    }
);



const supportRequestReducer = createSlice({
    name: "withdrawRequest",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(
            getSupportRequest.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(getSupportRequest.fulfilled, (state, action) => {
            state.isLoading = false;
            if (action.meta.arg?.status === 1) {
                state.pendingData = action.payload;
                state.totalPendingData = action?.payload?.total;
            } else if (action.meta.arg?.status === 2) {
                state.acceptedData = action.payload;
                state.totalAcceptedData = action?.payload?.total;
            }
        });


        builder.addCase(
            getSupportRequest.rejected,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
            }
        );
        builder.addCase(supportRequestAccept.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(
            supportRequestAccept.fulfilled,
            (
                state,
                action: PayloadAction<any, string, { arg: AllSupportPayload }>
            ) => {
                state.isLoading = false;
                if (action.payload.data.status === true) {
                    state.pendingData = state.pendingData.filter(
                        (request) => request?._id !== action?.meta?.arg
                    );
                    setToast("success", `Support Request Accepted Successfully`);
                } else {
                    setToast("error", action.payload.data.message);
                }
            }
        );

        builder.addCase(supportRequestAccept.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(
            deleteSupportRequest.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            deleteSupportRequest.fulfilled,
            (
                state,
                action: PayloadAction<any, string, { arg: any }>
            ) => {

                state.isLoading = false;
                if (action?.payload?.status) {
                    state.pendingData = state.pendingData.filter(
                        (pending) => pending._id !== action?.meta?.arg
                    );
                    setToast("success", "Support Request Deleted Succesfully");
                }
            }
        );

        builder.addCase(
            deleteSupportRequest.rejected,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
            }
        );



    },
});

export default supportRequestReducer.reducer;
