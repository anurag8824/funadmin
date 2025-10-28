import { toast } from 'react-toastify';
"use client"

import { apiInstance, apiInstanceFetch } from "@/util/ApiInstance";
import { jwtDecode } from "jwt-decode";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setToast } from "@/util/toast";
import { SetDevKey } from "@/util/setAuthAxios";
import { secretKey } from "@/util/config";
import axios from "axios";

interface UserState {
  isAuth: boolean;
  admin: any;
  isLoading: boolean;
  imageUrl: any;
}
const flag =
  typeof window !== "undefined" && JSON.parse(sessionStorage.getItem("admin_"));
const initialState: UserState = {
  isAuth: false,
  admin: {},
  isLoading: false,
  imageUrl: "",
};

interface AllUsersPayload {
  adminId: string;
  start?: number;
  limit?: number;
  startDate?: string;
  data: any;
  endDate?: string;
  type?: string;
  email?: string;
}

export const signUpAdmin = createAsyncThunk(
  "admin/admin/signUp",
  async (payload: AllUsersPayload | undefined) => {
    return axios.post("admin/admin/signUp", payload);
  }
);

export const login = createAsyncThunk(
  "admin/admin/login",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.post("admin/admin/login", payload);
  }
);

export const adminProfileGet = createAsyncThunk(
  "admin/admin/profile",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`admin/admin/profile`);
  }
);

export const adminProfileUpdate = createAsyncThunk(
  "admin/admin/updateProfile",
  async (payload: AllUsersPayload | undefined) => {
    
    return apiInstanceFetch.patch(`admin/admin/updateProfile`, payload);
  }
);

export const adminProfileUpdated = createAsyncThunk(
  "admin/admin/updateProfile1",
  async (payload: AllUsersPayload | undefined) => {
    
    return axios.patch(`admin/admin/updateProfile`, payload?.data);
  }
);




export const uploadFile = createAsyncThunk(
  "admin/file/upload-file",
  async (payload: AllUsersPayload | undefined) => {
      
    return axios.post(`admin/file/upload-file`, payload?.data);
  }
);  

export const updateAdminPassword = createAsyncThunk(
  "admin/admin/updatePassword",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`admin/admin/updatePassword`, payload?.data);
  }
);

export const sendEmail: any = createAsyncThunk(
  "admin/admin/forgotPassword",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstance.post(
      `admin/admin/forgotPassword?email=${payload?.email}`
    );
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    logoutApi(state: any, action: PayloadAction<any>) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("admin");
      sessionStorage.removeItem("key");
      sessionStorage.removeItem("isAuth");
      state.admin = {};
      state.isAuth = false;
    },
  },
  extraReducers: (builder: any) => {
    builder.addCase(
      signUpAdmin.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      signUpAdmin.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload && action.payload?.data?.status === true) {
          setToast("success", "Admin sign up Successfully");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        } else {
          setToast("error", action?.payload?.data?.message);
        }
      }
    );
    builder.addCase(
      signUpAdmin.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(login.pending, (state: any, action: PayloadAction<any>) => {
      state.isLoading = true;
    });
    builder.addCase(
      login.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload && action.payload?.status !== false) {
          const token = action.payload.data;
          const decodedToken: any = jwtDecode(token);
          state.isAuth = true;

          state.admin = decodedToken;
          axios.defaults.headers.common["Authorization"] = action.payload.data;
          SetDevKey(secretKey);
          localStorage.setItem("token", token);
          sessionStorage.setItem("isAuth", JSON.stringify(true));
          sessionStorage.setItem("admin_", JSON.stringify(decodedToken));
          setToast("success", "Login Successfully");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
        } else {
          setToast("error", action.payload?.message);
        }
      }
    );
    builder.addCase(
      login.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      adminProfileGet.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      adminProfileGet.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.admin = action.payload.data;
      }
    );
    builder.addCase(
      adminProfileGet.rejected,
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

    builder.addCase(
      sendEmail.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      sendEmail.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload?.status) {
          setToast("success", action?.payload?.message);
        }
      }
    );
    builder.addCase(
      sendEmail.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      adminProfileUpdate.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      adminProfileUpdate.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload?.status === true) {
          state.admin = action.payload?.data;
          setToast("success", "Admin profile  update successfully");
        } else {
          setToast("error", action.payload.message);
        }
      }
    );
    builder.addCase(
      adminProfileUpdate.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

      builder.addCase(
        adminProfileUpdated.pending,
        (state: any, action: PayloadAction<any>) => {
          state.isLoading = true;
        }
      );
     builder.addCase(
       adminProfileUpdated.fulfilled,
       (state: any, action: PayloadAction<any>) => {
         state.isLoading = false;
         const currentAdmin = state.admin;
         const emailUpdated =
           action.payload?.data?.data?.email !== currentAdmin?.email;
         const passwordUpdated =
           action.payload?.data?.data?.password !== currentAdmin?.password;
         if (action.payload?.data?.status === true) {
           state.admin = action.payload?.data;
           setToast("success", "Admin profile updated successfully");
           if (emailUpdated || passwordUpdated) {
             window.location.href = "/";
           }
         } else {
           setToast("error", action.payload.message);
         }
       }
     );

      builder.addCase(
        adminProfileUpdated.rejected,
        (state: any, action: PayloadAction<any>) => {
          state.isLoading = false;
          setToast("error", action.payload?.message);
        }
      );

    builder.addCase(
      updateAdminPassword.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      updateAdminPassword.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data?.status === true) {
          state.admin = action.payload.data?.data;
          setToast("success", "Admin password update successfully");
             window.location.href = "/";

        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );
    builder.addCase(
      updateAdminPassword.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );
  },
});

export default adminSlice.reducer;
export const { logoutApi } = adminSlice.actions;
