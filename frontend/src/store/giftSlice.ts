import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toast";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface GiftState {
  allGift: any[];
  totalGift: number;
  alGiftCategory: any[];
  isLoading: boolean;
}

const initialState: GiftState = {
  allGift: [],
  totalGift: 0,
  alGiftCategory: [],
  isLoading: false,
};

interface AllGiftPayload {
  start?: number;
  limit?: number;
  type?: string;
  meta: any;
  giftId: String;
  giftCategoryId: String;
  data: any;
}

export const allGiftApi = createAsyncThunk("admin/gift/getGifts", async () => {
  return apiInstanceFetch.get(`admin/gift/getGifts`);
});

export const deleteGift = createAsyncThunk(
  "admin/gift/deleteGift",
  async (payload: AllGiftPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/gift/deleteGift?giftId=${payload?.giftId}`, {}
    );
  }
);

export const addGift = createAsyncThunk(
  "admin/gift/createGift",
  async (payload: AllGiftPayload | undefined) => {
    
    return apiInstanceFetch.post(`admin/gift/createGift`, payload?.data);
  }
);

export const updateGift = createAsyncThunk(
  "admin/gift/updateGift?giftId",
  async (payload: AllGiftPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/gift/updateGift?giftId=${payload?.giftId}`,
      payload.data
    );
  }
);

export const allGiftCategory = createAsyncThunk(
  "admin/giftCategory/getGiftCategory",
  async (payload: AllGiftPayload | undefined) => {
    return apiInstanceFetch.get(`admin/giftCategory/getGiftCategory`);
  }
);

export const deleteGiftCategory = createAsyncThunk(
  "admin/giftCategory/deleteGiftCategory",
  async (payload: AllGiftPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/giftCategory/deleteGiftCategory?giftCategoryId=${payload?.giftCategoryId}` , {}
    );
  }
);

export const addGiftCategory = createAsyncThunk(
  "admin/giftCategory/createGiftCategory",
  async (payload: AllGiftPayload | undefined) => {
    return axios.post(`admin/giftCategory/createGiftCategory`, payload?.data);
  }
);

export const updateGiftCategory = createAsyncThunk(
  "admin/giftCategory/updateGiftCategory",
  async (payload: AllGiftPayload | undefined) => {
    return axios.patch(
      `admin/giftCategory/updateGiftCategory?giftCategoryId=${payload?.giftCategoryId}`,
      payload.data
    );
  }
);

const giftReducer = createSlice({
  name: "gift",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allGiftApi.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(allGiftApi.fulfilled, (state, action) => {
      state.allGift = action.payload.data;
      state.isLoading = false;
    });

    builder.addCase(
      allGiftApi.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(deleteGift.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      deleteGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        state.allGift = state.allGift.filter(
          (gift: any) => gift?._id !== action?.meta?.arg?.giftId
        );
        setToast("success", " Gift Delete Successfully");
        state.isLoading = false;
      }
    );

    builder.addCase(
      deleteGift.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addGift.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          state.allGift.unshift(action?.payload?.data);
          setToast("success", "Gift New Added");
        } else {
          setToast("error", action.payload.message);
        }
      }
    );

    builder.addCase(addGift.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateGift.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const { giftId } = action.meta.arg;

          const findGiftIndex = state.allGift.findIndex(
            (gift) => gift?._id == giftId
          );

          if (findGiftIndex !== -1) {
            state.allGift[findGiftIndex] = {
              ...state.allGift[findGiftIndex],
              ...action.payload?.data,
            };
          }

          setToast("success", ` Gift Update Successfully`);
        } else {
          setToast("error", action.payload.message);
        }
      }
    );

    builder.addCase(updateGift.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      allGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      allGiftCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        state.alGiftCategory = action.payload.data;
        state.isLoading = false;
      }
    );

    builder.addCase(
      allGiftCategory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      deleteGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteGiftCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        const deletedUserIds = action.meta.arg?.giftCategoryId;
        state.isLoading = false;
        state.alGiftCategory = state.alGiftCategory.filter(
          (gift: any) => !deletedUserIds.includes(gift?._id)
        );
        setToast("success", " Gift Category Delete Successfully");
      }
    );

    builder.addCase(
      deleteGiftCategory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addGiftCategory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addGiftCategory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.alGiftCategory?.unshift(action?.payload?.data?.data);
          setToast("success", `New Gift Category Created`);
        }
      }
    );

    builder.addCase(addGiftCategory.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateGiftCategory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateGiftCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllGiftPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const giftCategoryIndex = state.alGiftCategory.findIndex(
            (song) => song?._id === action.meta.arg?.giftCategoryId
          );
          if (giftCategoryIndex !== -1) {
            state.alGiftCategory[giftCategoryIndex] = {
              ...state.alGiftCategory[giftCategoryIndex],
              ...action.payload.data?.data,
            };
          }
          setToast("success", ` Gift Category Update Successfully`);
        }
      }
    );

    builder.addCase(updateGiftCategory.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default giftReducer.reducer;
