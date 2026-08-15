import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    // Free ngrok tunnels serve an HTML "you're about to visit..." warning
    // page to browser-like requests instead of proxying to the backend,
    // which breaks XHR/fetch calls (they can't click through it) — this
    // header is ngrok's documented bypass. Harmless against a real
    // deployment or any other host, so it's safe to always send.
    "ngrok-skip-browser-warning": "true",
  },
});

// Attaches the signed-in member's bearer token to every request — the
// backend rejects anything under /api/v1/** (besides /auth/**) without one.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Guards against firing the redirect below more than once when several
// requests in flight all come back 401 at the same time.
let redirectingToLogin = false;

// Every backend error response is { "error": "human-readable message" }
// (api-conventions.md). Without this, call sites see axios's generic
// "Request failed with status code 400" instead of the real message —
// this interceptor unwraps it so every existing `error.message` /
// `error instanceof Error` call site across the app shows the right text
// with no further changes needed.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url ?? "";

    // A 401 from anywhere except the login attempt itself means the
    // session is gone (expired token, member disabled, etc.) — clear it
    // and send the user back to sign in. Excluding /auth/login specifically
    // so a wrong-password attempt on the login page doesn't bounce the user
    // in a loop; that 401 is handled by the login form itself.
    if (
      status === 401 &&
      !requestUrl.includes("/auth/login") &&
      typeof window !== "undefined"
    ) {
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
      return Promise.reject(
        new Error("Your session has expired. Please sign in again."),
      );
    }

    const backendMessage = error?.response?.data?.error;
    if (typeof backendMessage === "string" && backendMessage.trim()) {
      return Promise.reject(new Error(backendMessage));
    }
    if (error?.code === "ECONNABORTED" || error?.message === "Network Error") {
      return Promise.reject(
        new Error("Can't reach the server right now. Please try again."),
      );
    }
    return Promise.reject(error);
  },
);
