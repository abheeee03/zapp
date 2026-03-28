import axios from "axios";

export type AuthUser = {
  id: string;
  email: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
  message: string;
};

type CurrentUserResponse = AuthUser & {
  link: Array<{
    id: string;
    title: string;
    url: string;
  }>;
};

export const TOKEN_STORAGE_KEY = "zap_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const saveAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const hasAuthToken = () => {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
};

export const loginRequest = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/user/login", { email, password });
  return response.data;
};

export const signupRequest = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/user/signup", { email, password });
  return response.data;
};

export const getCurrentUserRequest = async (): Promise<CurrentUserResponse> => {
  const response = await api.get<CurrentUserResponse>("/user");
  return response.data;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong";
  }

  const message = (error.response?.data as { message?: string } | undefined)?.message;
  return message ?? "Request failed";
};
