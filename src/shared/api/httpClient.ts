import { axiosInstance } from "@/shared/api/axiosInstance";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { HttpClientRequestConfig, HttpClientResponse } from "../types/dataType";

/*
  TODO:
  퍼사드 패턴
  복잡한 시스템을 한곳에 모아 관리하였고 인터페이스(호출부)는 간단하게 사용할 수 있도록 했습니다
  클라이언트는 이 구현 클래스를 훅으로 사용할 수 있습니다
*/

const RETRY_COUNT = 2;
const TIMEOUT_MS = 10000;

class HttpClient {
  async request<T>({
    url,
    method,
    payload,
    params,
    headers,
  }: HttpClientRequestConfig<T>): Promise<HttpClientResponse<T>> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);
    let lastError: unknown;

    const response: HttpClientResponse<T> = {
      data: null,
      loading: true,
      error: null,
    };

    try {
      for (let i = 0; i <= RETRY_COUNT; i++) {
        try {
          const config: AxiosRequestConfig = {
            url,
            method,
            data: payload,
            params,
            headers,
            signal: abortController.signal,
          };
          const axiosResponse = await axiosInstance(config);
          response.data = axiosResponse.data as T;
          return response;
        } catch (err) {
          lastError = err;
          if (axios.isCancel(err)) {
            console.log("Request canceled:", (err as AxiosError).message);
            break;
          }
          if (i < RETRY_COUNT) {
            console.log(
              `Request failed, retrying... (${i + 1}/${RETRY_COUNT})`
            );
          }
        }
      }

      const error =
        lastError instanceof Error ? lastError : new Error(String(lastError));
      response.error = error;
      throw error;
    } finally {
      response.loading = false;
      clearTimeout(timeoutId);
    }
  }
}

export const httpClient = new HttpClient();
