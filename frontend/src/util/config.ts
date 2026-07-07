function normalizeBaseUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return "http://localhost:8000/";
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export const baseURL: string = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/"
);

export const secretKey: string = process.env.NEXT_PUBLIC_SECRET_KEY || "";

export const projectName: string =
  process.env.NEXT_PUBLIC_PROJECT_NAME || "FuntApp Admin";
