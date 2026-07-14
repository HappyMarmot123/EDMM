export type MobilePlatform = "android" | "ios" | "other";

// Android은 iPad/iPhone UA에도 없는 "android" 토큰으로 판별한다.
// iOS 판별은 iPhone/iPad/iPod을 포함한다(Android보다 나중에 검사).
export function getMobilePlatform(userAgent: string): MobilePlatform {
  const ua = userAgent.toLowerCase();

  if (ua.includes("android")) {
    return "android";
  }

  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }

  return "other";
}
