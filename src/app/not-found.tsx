import Link from "next/link";
import { RouteFeedbackShell } from "@/shared/components/routeFeedbackShell";

export default function NotFound() {
  return (
    <RouteFeedbackShell
      rootClassName="bg-neutral-900 min-h-screen"
      contentClassName="px-4 text-center"
    >
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-8 text-2xl font-semibold">
          페이지를 찾을 수 없습니다.
        </h2>
        <p className="mb-8 text-neutral-400">
          요청하신 페이지가 존재하지 않거나 현재 사용할 수 없습니다.
        </p>
        <Link
          href="/"
          className="rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-neutral-200"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </RouteFeedbackShell>
  );
}
