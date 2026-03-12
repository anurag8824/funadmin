import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface hashTagState {
  allHashTagData: any[];
  totalHashTag: number;
  isLoading: boolean;
}

const initialState: hashTagState = {
  allHashTagData: [],
  totalHashTag: 0,
  isLoading: false,
};

interface AllHashTagPayload {
  start?: number;
  limit?: number;
  meta: any;
  hashTagId?: string;
  data: any;
}

export const getHashtag : any = createAsyncThunk(
  "admin/hashTag/getbyadmin",
  async (payload: AllHashTagPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/hashTag/getbyadmin?start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const deleteHastTag = createAsyncThunk(
  "admin/hashTag/delete",
  async (payload: AllHashTagPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/hashTag/delete?hashTagId=${payload?.hashTagId}`, {}
    );
  }
);

export const addHashTag = createAsyncThunk(
  "admin/hashTag/create",
  async (payload: AllHashTagPayload | undefined) => {
    
    return apiInstanceFetch.post("admin/hashTag/create", payload?.data);
  }
);

export const updateHashTag = createAsyncThunk(
  "admin/hashTag/update",
  async (payload: AllHashTagPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/hashTag/update?hashTagId=${payload?.hashTagId}`,
      payload.data
    );
  }
);

const hashTagReducer = createSlice({
  name: "hashTag",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getHashtag.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      getHashtag.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        state.isLoading = false;
        state.allHashTagData = action.payload.data;
        state.totalHashTag = action.payload.total
      }
    );

    builder.addCase(
      getHashtag.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );
    builder.addCase(
      deleteHastTag.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteHastTag.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        const deletedHashTagIds = action.meta.arg?.hashTagId;
        state.isLoading = false;
        state.allHashTagData = state.allHashTagData.filter(
          (hashTag: any) => !deletedHashTagIds.includes(hashTag?._id)
        );
        setToast("success", " HashTag Delete Successfully");
      }
    );

    builder.addCase(
      deleteHastTag.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addHashTag.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addHashTag.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;
        if (action.payload.status === true) {
          state.allHashTagData?.unshift(action?.payload?.data);
          setToast("success", `New HashTag Created`);
        }
      }
    );

    builder.addCase(addHashTag.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateHashTag.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateHashTag.fulfilled,
      (
        state,
        action: PayloadAction<any, string, { arg: AllHashTagPayload }>
      ) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const hashTagIndex = state.allHashTagData.findIndex(
            (hashTag) => hashTag?._id === action?.meta.arg?.hashTagId
          );
          if (hashTagIndex !== -1) {
            state.allHashTagData[hashTagIndex] = {
              ...state.allHashTagData[hashTagIndex],
              ...action.payload?.data,
            };
          }
          setToast("success", ` HashTag Update Successfully`);
        }
      }
    );

    builder.addCase(updateHashTag.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default hashTagReducer.reducer;
