import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface SongState {
  allSongData: any[];
  totalSong: number;
  songCategoryData: any[];
  totalSongCategory: number;
  isLoading: boolean;
}

const initialState: SongState = {
  allSongData: [],
  totalSong: 0,
  songCategoryData: [],
  totalSongCategory: 0,
  isLoading: false,
};

interface AllSongPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta?: any;
  fakeUserId?: String;
  songId?: String;
  songCategoryId?: String;
  id?: string;
  data?: any;
}

export const allSong = createAsyncThunk(
  "admin/song/getSongs",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/song/getSongs?startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const deleteSong = createAsyncThunk(
  "admin/song/deletesong?songId",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/song/deletesong?songId=${payload?.songId}`, {}
    );
  }
);

export const addSong = createAsyncThunk(
  "admin/song/createSong",
  async (payload: AllSongPayload | undefined) => {
    
    return apiInstanceFetch.post(`admin/song/createSong`, payload?.data);
  }
);

export const updateSong = createAsyncThunk(
  "admin/song/updateSong?songId",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/song/updateSong?songId=${payload?.songId}`,
      payload.data
    );
  }
);

export const allSongCategory = createAsyncThunk(
  "admin/songCategory/getSongCategory",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/songCategory/getSongCategory?startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const deleteSongCategory = createAsyncThunk(
  "admin/songCategory/deleteSongCategory",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/songCategory/deleteSongCategory?songCategoryId=${payload?.songCategoryId}`, {}
    );
  }
);

export const addSongCategory = createAsyncThunk(
  "admin/songCategory/create",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.post(`admin/songCategory/create`, payload?.data);
  }
);

export const updateSongCategory = createAsyncThunk(
  "admin/songCategory/delete",
  async (payload: AllSongPayload | undefined) => {
    return apiInstanceFetch.patch(
      `admin/songCategory/update?songCategoryId=${payload?.songCategoryId}`,
      payload.data
    );
  }
);

const songReducer = createSlice({
  name: "song",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allSong.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      allSong.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        state.allSongData = action.payload.data;
        state.totalSong = action.payload.total;
        state.isLoading = false;
      }
    );

    builder.addCase(allSong.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });

    builder.addCase(deleteSong.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      deleteSong.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        const deletedUserIds = action.meta.arg?.songId;
        state.isLoading = false;
        state.allSongData = state.allSongData.filter(
          (song: any) => !deletedUserIds.includes(song?._id)
        );
        setToast("success", " Song Delete Successfully");
      }
    );

    builder.addCase(
      deleteSong.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addSong.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(addSong.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload.status === true) {
        state.allSongData?.unshift(action?.payload?.data);
        setToast("success", `New Song Created`);
      }
    });

    builder.addCase(addSong.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateSong.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateSong.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const songIndex = state.allSongData.findIndex(
            (song) => song?._id === action.meta.arg?.songId
          );
          if (songIndex !== -1) {
            state.allSongData[songIndex] = {
              ...state.allSongData[songIndex],
              ...action.payload?.data,
            };
          }
          setToast("success", ` Song Update Successfully`);
        }
      }
    );

    builder.addCase(updateSong.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      allSongCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      allSongCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        state.songCategoryData = action.payload.songCategory;
        state.totalSongCategory = action.payload.totalSongCategory;
        state.isLoading = false;
      }
    );

    builder.addCase(
      allSongCategory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      deleteSongCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteSongCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        const deletedUserIds = action.meta.arg?.songCategoryId;
        state.isLoading = false;
        state.songCategoryData = state.songCategoryData.filter(
          (song: any) => !deletedUserIds.includes(song?._id)
        );
        setToast("success", " Song Category Delete Successfully");
      }
    );

    builder.addCase(
      deleteSongCategory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addSongCategory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addSongCategory.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;
        if (action.payload.status === true) {
          state.songCategoryData?.unshift(action?.payload?.songCategory);
          setToast("success", `New Song Category Created`);
        }
      }
    );

    builder.addCase(addSongCategory.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateSongCategory.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateSongCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllSongPayload }>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const songIndex = state.songCategoryData.findIndex(
            (song) => song?._id === action.meta.arg?.songCategoryId
          );
          if (songIndex !== -1) {
            state.songCategoryData[songIndex] = {
              ...state.songCategoryData[songIndex],
              ...action.payload?.songCategory,
            };
          }
          setToast("success", ` Song Category Update Successfully`);
        }
      }
    );

    builder.addCase(updateSongCategory.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default songReducer.reducer;
