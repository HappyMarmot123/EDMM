import type { Method } from "axios";

export interface HttpClientRequestConfig {
  url: string;
  method: Method;
  payload?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
}

export interface HttpClientResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
