import { uploadFile } from '@/store/adminSlice';
import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface settingTagState {
  settingData: any;
  withdrawSetting: any;
  totalHashTag: number;
  isLoading: boolean;
}

const initialState: settingTagState = {
  settingData: {},
  withdrawSetting: [],
  totalHashTag: 0,
  isLoading: false,
};

interface settingPayload {
  start?: number;
  limit?: number;
  meta: any;
  type: string;
  settingId?: string;
  data: any;
  reportReasonId: any;
  watermarkType: any;
  watermarkIcon: any;
}

export const getSetting = createAsyncThunk(
  "admin/setting/getSetting",
  async (payload: settingPayload | undefined) => {
    return apiInstanceFetch.get(`admin/setting/getSetting`);
  }
);

export const getReportSetting = createAsyncThunk(
  "admin/reportReason/get",
  async (payload: settingPayload | undefined) => {
    return apiInstanceFetch.get(`admin/reportReason/get`);
  }
);

export const createSetting = createAsyncThunk(
  "admin/setting/createSetting",
  async (payload: settingPayload | undefined) => {
    return axios.post("admin/setting/createSetting", payload?.data);
  }
);

export const createReportSetting: any = createAsyncThunk(
  "admin/reportReason/store",
  async (payload: settingPayload | undefined) => {
    return axios.post("admin/reportReason/store", payload);
  }
);

export const updateSetting = createAsyncThunk(
  "admin/setting/updateSetting",
  async (payload: settingPayload | undefined) => {
    return axios.patch(
      `admin/setting/updateSetting?settingId=${payload?.settingId}`,
      payload.data
    );
  }
);

export const updateProfileManagement = createAsyncThunk(
  "/admin/setting/updateProfilePictureCollection",
  async (payload: any) => {
    return axios.patch(
      `/admin/setting/updateProfilePictureCollection`,
      payload,
    );
  }
);

export const uploadProfileImage = createAsyncThunk(
  "/admin/file/uploadBulkMedia",
  async (payload: any) => {
    return axios.put(
      `/admin/file/uploadBulkMedia`,
      payload.data,
      {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
    );
  }
);

export const updateWaterMark = createAsyncThunk(
  "admin/setting/modifyWatermarkSetting",
  async (payload: settingPayload | undefined) => {
    return axios.patch(`admin/setting/modifyWatermarkSetting`, payload);
  }
);

export const updateReportSetting = createAsyncThunk(
  "admin/reportReason/update",
  async (payload: settingPayload | undefined) => {
    return axios.patch(
      `admin/reportReason/update?reportReasonId=${payload.reportReasonId}`,
      payload.data
    );
  }
);

export const settingSwitch = createAsyncThunk(
  "admin/setting/handleSwitch",
  async (payload: settingPayload | undefined) => {
    return axios.patch(
      `admin/setting/handleSwitch?settingId=${payload?.settingId}&type=${payload?.type}`,
      payload.data
    );
  }
);

export const adSettingSwitch = createAsyncThunk(
  "admin/setting/switchAdSetting",
  async (payload: settingPayload | undefined) => {
    return axios.patch(
      `admin/setting/switchAdSetting?settingId=${payload?.settingId}&type=${payload?.type}`,
      payload.data
    );
  }
);

export const getWithdrawMethod = createAsyncThunk(
  "admin/withdraw/get",
  async () => {
    return apiInstanceFetch.get(`admin/withdraw/get`);
  }
);

export const createWithdrawMethod = createAsyncThunk(
  "admin/withdraw/create",
  async (payload: any) => {
    return axios.post("admin/withdraw/create", payload);
  }
);

export const updateWithdrawMethod = createAsyncThunk(
  "admin/withdraw/update",
  async (payload: any) => {
    return axios.patch(
      `admin/withdraw/update?withdrawId=${payload?.id}`,
      payload.data
    );
  }
);
export const activeWithdrawMethod = createAsyncThunk(
  "admin/withdraw/handleSwitch",
  async (payload: any) => {
    return axios.patch(`admin/withdraw/handleSwitch?withdrawId=${payload}`);
  }
);
export const deleteWithdrawMethod = createAsyncThunk(
  "admin/withdraw/delete",
  async (payload: any) => {
    return axios.delete(`admin/withdraw/delete?withdrawId=${payload}`);
  }
);

export const deleteReportSetting = createAsyncThunk(
  "admin/reportReason/delete",
  async (payload: any) => {
    return axios.delete(`admin/reportReason/delete?reportReasonId=${payload}`);
  }
);


export const StorageSetting = createAsyncThunk(
  "admin/setting/switchStorageOption",
  async ({settingId , type} : any) => {
    return axios.patch(`admin/setting/switchStorageOption?settingId=${settingId}&type=${type}`);
  }
);


const settingReducer = createSlice({
  name: "setting",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getSetting.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      getSetting.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        state.settingData = action.payload.data;
      }
    );

    builder.addCase(
      getSetting.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      getReportSetting.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getReportSetting.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        state.settingData = action.payload.data;
      }
    );

    builder.addCase(
      getReportSetting.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(createSetting.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      createSetting.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData = action?.payload?.data?.data;
          setToast("success", `Setting Created`);
        }
      }
    );

    builder.addCase(createSetting.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(createReportSetting.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      createReportSetting.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData.unshift(action.payload.data.data);
          setToast("success", `Report Reason Created`);
        }
      }
    );

    builder.addCase(createReportSetting.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateProfileManagement.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateProfileManagement.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData.profilePictureCollection = action?.payload?.data?.data;
          setToast("success", ` Setting Update Successfully`);
        }else if (action.payload.data.status === false) {
          setToast("error", `${action.payload.data.message}`);
        }
      }
    );

    builder.addCase(updateProfileManagement.rejected, (state) => {
      state.isLoading = false;
    });


    builder.addCase(updateSetting.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateSetting.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData = action?.payload?.data?.data;
          setToast("success", ` Setting Update Successfully`);
        }else if (action.payload.data.status === false) {
          setToast("error", `${action.payload.data.message}`);
        }
      }
    );

    builder.addCase(updateSetting.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(settingSwitch.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateReportSetting.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateReportSetting.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          const reportIndex = state.settingData.findIndex(
            (setting: any) => setting._id === action.payload.data.data._id
          );

          if (reportIndex !== -1) {
            state.settingData[reportIndex] = {
              ...state.settingData[reportIndex],
              ...action.payload.data?.data,
            };
          }
          setToast("success", ` Setting Update Successfully`);
        }
      }
    );

    builder.addCase(updateReportSetting.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      settingSwitch.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData = action?.payload?.data?.data;
          setToast("success", ` Setting Update Successfully`);
        }else if (action.payload.data.status === false) {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(settingSwitch.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(adSettingSwitch.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      adSettingSwitch.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData = action?.payload?.data?.data;
          setToast("success", ` Setting Update Successfully`);
        }
      }
    );

    builder.addCase(adSettingSwitch.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      getWithdrawMethod.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(getWithdrawMethod.fulfilled, (state, action: any) => {
      state.isLoading = false;
      state.withdrawSetting = action.payload.data;
    });

    builder.addCase(
      getWithdrawMethod.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(
      createWithdrawMethod.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createWithdrawMethod.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.withdrawSetting.unshift(action?.payload?.data?.data);

          setToast("success", "Withdraw Method Add Successfully");
        } else {
          setToast("error", action?.payload?.data?.message);
        }
      }
    );
    builder.addCase(createWithdrawMethod.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      updateWithdrawMethod.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updateWithdrawMethod.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action.payload.status) {
          if (action.payload.status) {
            const Index = state.withdrawSetting.findIndex(
              (withdrawSetting) =>
                withdrawSetting?._id === action?.payload?.data?.data?._id
            );

            if (Index !== -1) {
              state.withdrawSetting[Index] = {
                ...state.withdrawSetting[Index],
                ...action.payload.data.data,
              };
            }
          }
          setToast("success", "Service Update Successfully");
        } else {
          setToast("error", action.payload.data.message);
        }
        state.isLoading = false;
      }
    );

    builder.addCase(updateWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      activeWithdrawMethod.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      activeWithdrawMethod.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action?.payload?.data?.status) {
          const updatedWithdraw = action.payload.data.data;
          const Index = state.withdrawSetting.findIndex(
            (withdrawSetting) => withdrawSetting?._id === updatedWithdraw?._id
          );
          if (Index !== -1) {
            state.withdrawSetting[Index].isActive = updatedWithdraw.isActive;
          }
          setToast("success", "Withdraw Status Update Successfully");
        } else {
          setToast("error", action.payload.data.message);
        }
        state.isLoading = false;
      }
    );

    builder.addCase(activeWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteWithdrawMethod.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteWithdrawMethod.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        state.withdrawSetting = state.withdrawSetting.filter(
          (withdrawSetting: any) => withdrawSetting._id !== action?.meta?.arg
        );

        setToast("success", "Withdraw Delete Successfully");
      } else {
        setToast("error", action.payload.data?.message);
      }
      state.isLoading = false;
    });

    builder.addCase(deleteWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteReportSetting.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteReportSetting.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        state.settingData = state.settingData.filter(
          (settingData: any) => settingData._id !== action?.meta?.arg
        );

        setToast("success", "Report Delete Successfully");
      } else {
        setToast("error", action.payload.data?.message);
      }
      state.isLoading = false;
    });

    builder.addCase(deleteReportSetting.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      StorageSetting.fulfilled,
      (state, action: PayloadAction<any, string, { arg: settingPayload }>) => {
        state.isLoading = false;
        if (action.payload.data.status === true) {
          state.settingData = action?.payload?.data?.data;
          setToast("success", ` Setting Update Successfully`);
        }else if (action.payload.data.status === false) {
          setToast("error", action.payload.data.message);
        }
      }
    );

    builder.addCase(StorageSetting.rejected, (state) => {
      state.isLoading = false;
    });

        // builder.addCase(
        //   uploadProfileImage.pending,
        //   (state: any, action: PayloadAction<any>) => {
        //     state.isLoading = true;
        //   }
        // );
        // builder.addCase(
        //   uploadProfileImage.fulfilled,
        //   (state: any, action: PayloadAction<any>) => {
              
        //     state.isLoading = false;
        //     state.imageUrl = action.payload.data?.url;
        //   }
        // );
        // builder.addCase(
        //   uploadProfileImage.rejected,
        //   (state: any, action: PayloadAction<any>) => {
        //     state.isLoading = false;
        //     setToast("error", action.payload?.message);
        //   }
        // );
  },
});

export default settingReducer.reducer;
