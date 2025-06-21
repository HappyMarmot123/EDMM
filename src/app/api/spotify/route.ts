import { NextResponse } from "next/server";
import { httpClient } from "@/shared/api/httpClient";
import { SpotifyTokenResponse } from "@/shared/types/dataType";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_ACCOUNTS_URL = process.env.SPOTIFY_ACCOUNTS_BASE_URL;

// TODO:
//  Next.js 앱 라우터의 규칙에 따라 이 함수가 자동으로 인식되고 실행됩니다.
// 파일 경로 기반 라우팅으로 route.ts (또는 .js) 파일을 만들면,
// 이 파일은 /api/spotify-token URL 경로에 대한 API 엔드포인트를 정의하게 됩니다.

export async function GET() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_ACCOUNTS_URL) {
    console.error("Error: Spotify environment variables are not configured.");
    return NextResponse.json(
      { error: "Spotify environment variables are not configured." },
      { status: 500 }
    );
  }

  const authString = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await httpClient.request<SpotifyTokenResponse>({
      url: `${SPOTIFY_ACCOUNTS_URL}/token`,
      method: "POST",
      payload: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.data) {
      throw new Error("No data received from Spotify");
    }

    // 토큰과 만료 시간을 클라이언트에 전달 (실제 만료 시간보다 약간 짧게 설정)
    return NextResponse.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in - 60, // 60초 여유
    });
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    let errorMessage = "Failed to fetch Spotify token";
    let errorStatus = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
