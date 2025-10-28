import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { baseURL, secretKey } from "./config";
import { setToast } from "./toastServices";
import { createSelector } from "reselect";

const selectStates = (state) => state;

export const isLoading = createSelector(selectStates, (state) => {
  const slices = Object.values(state);
  const loading = slices.some((slice: any) => {
    if (
      typeof slice === "object" &&
      slice !== null &&
      slice.isLoading === true
    ) {
      return true;
    }
    return false;
  });
  return loading;
});

interface ApiResponseError {
  message: string | string[];
  code?: string;
}

// const getTokenData = (): string | null => localStorage.getItem("token");
const getTokenData = (): string | null => {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const apiInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    secretKey,
    "Content-Type": "application/json",
  },
});

const cancelTokenSource = axios.CancelToken.source();
const token: string | null = getTokenData();

axios.defaults.headers.common["Authorization"] = token ? `${token}` : "";
axios.defaults.headers.common["key"] = secretKey;

apiInstance.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    config.cancelToken = cancelTokenSource.token;
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response: AxiosResponse): any => response.data,
  (error: AxiosError): Promise<void> => {
    const errorData = error.response?.data as ApiResponseError | undefined;

    if (error.response?.status === 401) {
      sessionStorage.clear();
      localStorage.clear();
      axios.defaults.headers.common["key"] = "";
      axios.defaults.headers.common["Authorization"] = "";
      window.location.href = "/";
    }

    if (!errorData) {
      setToast("error", "An unexpected error occurred.");
      return Promise.reject(error);
    }

    if (!errorData.message) {
      setToast("error", "Something went wrong!");
    }

    if (
      errorData.code === "E_USER_NOT_FOUND" ||
      errorData.code === "E_UNAUTHORIZED"
    ) {
      localStorage.clear();
      window.location.reload();
    }

    if (typeof errorData.message === "string") {
      setToast("error", errorData.message);
    } else if (Array.isArray(errorData.message)) {
      errorData.message.forEach((msg: string) => setToast("error", msg));
    }

    return Promise.reject(error);
  }
);

const handleErrors = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const data = await response.json();


      if (response.status === 401) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(data);
      }

    if (Array.isArray(data.message)) {
      data.message.forEach((msg: string) => setToast("error", msg));
    } else {
      setToast("error", data.message || "Unexpected error occurred.");
    }

    return Promise.reject(data);
  }

  return response.json();
};

const getHeaders = (): { [key: string]: string } => ({
  key: secretKey,
  Authorization: getTokenData() ? `${getTokenData()}` : "",
  "Content-Type": "application/json",
});

export const apiInstanceFetch = {
  baseURL,
  get: (url: string) =>
    fetch(`${baseURL}${url}`, { method: "GET", headers: getHeaders() }).then(
      handleErrors
    ),

  post: (url: string, data: object) =>
    fetch(`${baseURL}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleErrors),

  patch: (url: string, data: object) =>
    fetch(`${baseURL}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleErrors),

  put: (url: string, data: object) =>
    fetch(`${baseURL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleErrors),

  delete: (url: string ,  data : object) =>
    fetch(`${baseURL}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleErrors),
};
