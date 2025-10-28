import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { baseURL } from "@/util/config";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface PostState {
  realPost: any[];
  totalRealPost: number;
  fakePostData: any[];
  totalFakePost: number;
  countryData: any[];
  userPostData: any[];
  allHashTagData: any[];
  postData: object;
  getUserProfileData: Object;
  isLoading: boolean;
}

const initialState: PostState = {
  realPost: [],
  totalRealPost: 0,
  fakePostData: [],
  totalFakePost: 0,
  allHashTagData: [],
  getUserProfileData: {},
  countryData: [],
  userPostData: [],
  postData: {},
  isLoading: false,
};

interface AllPostPayload {
  start?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  meta: any;
  fakeUserId: String;
  userId: String;
  id?: string;
  data: any;
  folderStructure: string;
  keyName: string;
}

export const allPost = createAsyncThunk(
  "admin/post/getPosts",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/post/getPosts?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`
    );
  }
);

export const getPostDetails: any = createAsyncThunk(
  "admin/user/getDetailOfPost?postId",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.get(`admin/post/getDetailOfPost?postId=${payload}`);
  }
);

export const getUserPost: any = createAsyncThunk(
  "admin/user/getUserPost?userId",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.get(
      `admin/post/getUserPost?userId=${payload?.id}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const deleteFakePost = createAsyncThunk(
  "admin/post/deletePost?postId",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.delete(
      `admin/post/deletePost?postId=${payload}`,
      {}
    );
  }
);

export const uploadDeleteImage = createAsyncThunk(
  "admin/file/removeUploadContent",
  async (payload: AllPostPayload) => {
    return axios.delete(`admin/file/removeUploadContent`, {
      data: payload,
    });
  }
);

export const allHashTag = createAsyncThunk(
  "admin/hashTag/getHashtag",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.get(`admin/hashTag/getHashtag`);
  }
);

export const addFakePost = createAsyncThunk(
  "admin/post/uploadfakePost",
  async (payload: AllPostPayload | undefined) => {
    return apiInstanceFetch.post(
      `admin/post/uploadfakePost?userId=${payload.fakeUserId}`,
      payload?.data
    );
  }
);

export const updateFakePost = createAsyncThunk(
  "admin/post/updatefakePost",
  async (payload: AllPostPayload | undefined) => {
    return axios.patch(
      `admin/post/updatefakePost?userId=${payload?.fakeUserId}&postId=${payload?.id}`,
      payload.data
    );
  }
);

export const uploadMultipleFiles = createAsyncThunk(
  "admin/file/upload-file",
  async (payload: any | undefined) => {
    return axios.put(`/admin/file/upload_multiple_files`, payload?.data);
  }
);

export const uploadFile = createAsyncThunk(
  "admin/file/upload-single-file",
  async (payload: any | undefined) => {
    return axios.post(`admin/file/upload-file`, payload?.data);
  }
);

const postReducer = createSlice({
  name: "post",
  initialState,
  reducers: {
    setGetProfileRemove(
      state,
      action: PayloadAction<{ type?: string; data?: any }>
    ) {
      state.getUserProfileData = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(allPost.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      allPost.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllPostPayload }>) => {
        if (action.meta.arg.type === "realPost") {
          state.realPost = action.payload.data;
          state.totalRealPost = action?.payload?.total;
        } else {
          state.fakePostData = action.payload.data;
          state.totalFakePost = action?.payload?.total;
        }
        state.isLoading = false;
      }
    );

    builder.addCase(allPost.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
    });

    builder.addCase(
      getUserPost.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getUserPost.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.userPostData = action.payload?.data;
        state.isLoading = false;
      }
    );

    builder.addCase(
      getUserPost.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getPostDetails.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getPostDetails.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getPostDetails.fulfilled,
      (state, action: PayloadAction<any, string, { arg: PayloadAction }>) => {
        state.postData = action.payload?.data;
        state.isLoading = false;
      }
    );

    builder.addCase(allHashTag.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      allHashTag.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.allHashTagData = action.payload.data;
      }
    );

    builder.addCase(
      allHashTag.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );
    builder.addCase(
      deleteFakePost.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      deleteFakePost.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllPostPayload }>) => {
        const deletedUserIds = action.meta.arg;
        state.isLoading = false;
        state.fakePostData = state?.fakePostData?.filter(
          (post: any) => post?._id !== deletedUserIds
        );

        state.realPost = state?.realPost?.filter(
          (post: any) => post?._id !== deletedUserIds
        );

        state.userPostData = state?.userPostData?.filter(
          (post: any) => post?._id !== deletedUserIds
        );

        setToast("success", " Post Delete Successfully");
      }
    );

    builder.addCase(
      deleteFakePost.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addFakePost.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addFakePost.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status === true) {
          const postData = { ...action.payload.data };
          postData.userImage = `${postData.userId.image}`;
          state.fakePostData?.unshift(postData);
          setToast("success", `New Post Created`);
        }
      }
    );

    builder.addCase(addFakePost.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      uploadMultipleFiles.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      uploadMultipleFiles.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.imageUrl = action.payload.data?.url;
      }
    );
    builder.addCase(
      uploadMultipleFiles.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      uploadFile.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      uploadFile.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.imageUrl = action.payload.data?.url;
      }
    );
    builder.addCase(
      uploadFile.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(updateFakePost.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateFakePost.fulfilled,
      (state, action: PayloadAction<any, string, { arg: AllPostPayload }>) => {
        state.isLoading = false;
        if (action.payload.data?.status === true) {
          const postIndex = state.fakePostData.findIndex(
            (post) => post?._id === action?.payload?.data?.data?._id
          );
          if (postIndex !== -1) {
            state.fakePostData[postIndex] = {
              ...state.fakePostData[postIndex],
              ...action.payload.data?.data,
            };
          }
          setToast("success", ` Post Update Successfully`);
        }
      }
    );

    builder.addCase(updateFakePost.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default postReducer.reducer;
