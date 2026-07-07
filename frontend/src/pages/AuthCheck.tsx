"use client";
import { useEffect } from "react";
import { useRouter } from "next/router";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/Registration",
  "/forgotPassword",
]);

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isAuth = sessionStorage.getItem("isAuth") === "true";
    const isPublicRoute = PUBLIC_ROUTES.has(router.pathname);

    if (!isAuth && !isPublicRoute) {
      router.replace("/");
      return;
    }

    if (isAuth && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [router.pathname]);

  return <>{children}</>;
};

export default AuthCheck;
