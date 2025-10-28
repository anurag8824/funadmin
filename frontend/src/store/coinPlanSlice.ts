import { apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface coinPlanState {
  coinPlan: any[];
  isLoading: boolean;
}

const initialState: coinPlanState = {
  coinPlan: [],
  isLoading: false,
};

interface AllcoinPlanPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta?: any;
  coinPlanId: String;
  id?: string;
  data: any;
}

export const getAllCoinPlan = createAsyncThunk(
  "admin/coinplan/get",
  async (payload) => {
    return apiInstanceFetch.get(`admin/coinplan/get`);
  }
);

export const deleteCoinPlan = createAsyncThunk(
  "admin/coinplan/delete",
  async (payload: AllcoinPlanPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/coinplan/delete?coinPlanId=${payload}` , {}
    );
  }
);

export const addCoinPlan = createAsyncThunk(
  "admin/coinplan/store",
  async (payload: AllcoinPlanPayload | undefined) => {
    return apiInstanceFetch.post(`admin/coinplan/store`, payload);
  }
);

export const updateCoinPlan = createAsyncThunk(
  "admin/coinplan/update",
  async (payload: AllcoinPlanPayload | undefined) => {
    
    return apiInstanceFetch.patch(
      `admin/coinplan/update?coinPlanId=${payload?.coinPlanId}`,
      payload
    );
  }
);
export const activeCoinPlan = createAsyncThunk(
  "admin/coinplan/handleSwitch",
  async (payload: AllcoinPlanPayload | undefined) => {
    return axios.patch(
      `admin/coinplan/handleSwitch?coinPlanId=${payload?.coinPlanId}`
    );
  }
);

const coinPlanSlice = createSlice({
  name: "coinPlan",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // get
    builder.addCase(getAllCoinPlan.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      getAllCoinPlan.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.coinPlan = action.payload?.data;
      }
    );
    builder.addCase(getAllCoinPlan.rejected, (state) => {
      state.isLoading = false;
    });

    // delete

    builder.addCase(
      deleteCoinPlan.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteCoinPlan.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllcoinPlanPayload }>
      ) => {
        state.isLoading = false;
        if (action?.payload?.status) {
          
          state.coinPlan = state.coinPlan.filter(
            (coinPlan) => coinPlan._id !== action?.meta?.arg
          );
          setToast("success", "coinPlan Delete Successfully");
        }
      }
    );

    // add

    builder.addCase(
      deleteCoinPlan.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addCoinPlan.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addCoinPlan.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;

        if (action.payload.status === true) {
          
          state.coinPlan?.unshift(action?.payload?.data);
          setToast("success", `New coinPlan Created`);
        }
      }
    );

    builder.addCase(addCoinPlan.rejected, (state) => {
      state.isLoading = false;
    });

    // update

    builder.addCase(updateCoinPlan.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateCoinPlan.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllcoinPlanPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const coinPlanIndex = state.coinPlan.findIndex(
            (coinPlan) => coinPlan?._id === action.meta.arg?.coinPlanId
          );
          if (coinPlanIndex !== -1) {
            state.coinPlan[coinPlanIndex] = {
              ...state.coinPlan[coinPlanIndex],
              ...action.payload.data,
            };
          }
          setToast("success", `coinPlan Update Successfully`);
        }
      }
    );

    builder.addCase(updateCoinPlan.rejected, (state) => {
      state.isLoading = false;
    });

    // active coin plan

    builder.addCase(activeCoinPlan.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      activeCoinPlan.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllcoinPlanPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const coinPlanIndex = state.coinPlan.findIndex(
            (coinPlan) => coinPlan?._id === action.meta.arg?.coinPlanId
          );
          if (coinPlanIndex !== -1) {
            
            state.coinPlan[coinPlanIndex] = {
              ...state.coinPlan[coinPlanIndex],
              ...action.payload.data?.data,
            };
          }
          setToast("success", `CoinPlan Update Successfully`);
        }
      }
    );

    builder.addCase(activeCoinPlan.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default coinPlanSlice.reducer;
