import { apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
    adminEarnings: any[];
    isLoading: boolean;
    isSkeleton: boolean;
    totalEarning : number;
}

const initialState: UserState = {
    adminEarnings: [],
    isLoading: false,
    isSkeleton: false,
    totalEarning : 0
};

interface AllUsersPayload {
    page?: number;
    size?: number;
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

export const getAdminEarning: any = createAsyncThunk(
    "admin/coinPlan/fetchUserCoinplanTransactions",
    async (payload: AllUsersPayload | undefined) => {
        return apiInstanceFetch.get(`admin/coinPlan/fetchUserCoinplanTransactions?startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.page}&limit=${payload?.size}`);
    }
);


const adminEaningSlice = createSlice({
    name: "banner",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getAdminEarning.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
            state.isLoading = true
        });
        builder.addCase(
            getAdminEarning.fulfilled,
            (state, action: PayloadAction<any>) => {
                
                state.isLoading = false;
                state.adminEarnings = action.payload.data;
                state.totalEarning = action.payload.totalAdminEarnings;
                state.isLoading = false

            }
        );
        builder.addCase(getAdminEarning.rejected, (state, action: PayloadAction<any>) => {
            state.isLoading = false;
        });

    },
});

export default adminEaningSlice.reducer;
