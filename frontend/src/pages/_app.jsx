"use client";
import { Providers } from "@/Provider";
import "@/assets/css/dateRange.css";
import "@/assets/css/default.css";
import "@/assets/css/custom.css";
import "@/assets/css/responsive.css";
import "@/assets/css/style.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { baseURL, secretKey } from "@/util/config";
import Loader from "../extra/Loader";
import AuthCheck from "./AuthCheck";

export default function App({ Component, pageProps }) {
  const getToken =
    typeof window !== "undefined" && localStorage.getItem("token");
  const getLayout = Component.getLayout || ((page) => page);
  axios.defaults.baseURL = baseURL;
  axios.defaults.headers.common["key"] = secretKey;
  axios.defaults.headers.common["Authorization"] = getToken
    ? `${getToken}`
    : "";

  return getLayout(
    <AuthCheck>
      <Providers>
        <ToastContainer />
        <Component {...pageProps} />
        <Loader />
      </Providers>
    </AuthCheck>
  );
}
