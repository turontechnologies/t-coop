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
