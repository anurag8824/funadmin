import { apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface CurrencyState {
  currency: any[];
  defaultCurrency: any;
  isLoading: boolean;
}

const initialState: CurrencyState = {
  currency: [],
  defaultCurrency: {},
  isLoading: false,
};

interface AllCurrencyPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta?: any;
  currencyId: String;
  id?: string;
  data: any;
}

export const getAllCurrency = createAsyncThunk(
  "admin/currency",
  async (payload) => {
    return apiInstanceFetch.get(`admin/currency`);
  }
);

export const deleteCurrency = createAsyncThunk(
  "admin/currency/delete",
  async (payload: AllCurrencyPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/currency/delete?currencyId=${payload}` , {}
    );
  }
);

export const addCurrency = createAsyncThunk(
  "admin/currency/create",
  async (payload: AllCurrencyPayload | undefined) => {
    return axios.post(`admin/currency/create`, payload);
  }
);

export const updateCurrency = createAsyncThunk(
  "admin/currency/update",
  async (payload: AllCurrencyPayload | undefined) => {
    return axios.patch(
      `admin/currency/update?currencyId=${payload?.currencyId}`,
      payload?.data
    );
  }
);
export const getDefaultCurrency = createAsyncThunk(
  "admin/currency/getDefault",
  async () => {
    return apiInstanceFetch.get(`admin/currency/getDefault`);
  }
);
export const setDefaultCurrency = createAsyncThunk(
  "admin/currency/setdefault",
  async (payload: AllCurrencyPayload | undefined) => {
    return axios.patch(`admin/currency/setdefault?currencyId=${payload}`);
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllCurrency.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      getAllCurrency.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.currency = action.payload?.data;
      }
    );
    builder.addCase(getAllCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteCurrency.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteCurrency.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllCurrencyPayload }>
      ) => {
        state.isLoading = false;
        if (action?.payload?.status) {
          state.currency = state.currency.filter(
            (currency) => currency._id !== action?.meta?.arg
          );
          setToast("success", action?.payload?.message);
        } else {
          setToast("success", action?.payload?.message);
        }
      }
    );

    builder.addCase(
      deleteCurrency.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addCurrency.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addCurrency.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;

        if (action.payload.data.status === true) {
          state.currency?.unshift(action?.payload?.data?.data);
          setToast("success", `New Currency Created`);
        }
      }
    );

    builder.addCase(addCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateCurrency.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateCurrency.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllCurrencyPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const currencyIndex = state.currency.findIndex(
            (currency) => currency?._id === action.meta.arg?.currencyId
          );
          if (currencyIndex !== -1) {
            state.currency[currencyIndex] = {
              ...state.currency[currencyIndex],
              ...action.payload.data?.data,
            };
          }
          setToast("success", `Currency Update Successfully`);
        }
      }
    );

    builder.addCase(updateCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(setDefaultCurrency.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      setDefaultCurrency.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;

        if (action.payload.data.status === true) {
          state.currency = action.payload?.data?.data;

          setToast("success", "Set Default Currency Successfully");
        }else if (action.payload.data.status === false) {
          setToast("error", action.payload.data.message);
        }
      }
    );
    builder.addCase(setDefaultCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(getDefaultCurrency.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getDefaultCurrency.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currency = action.payload.data;
    });
    builder.addCase(getDefaultCurrency.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default currencySlice.reducer;
