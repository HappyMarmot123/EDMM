"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/shared/providers/authProvider";
import { GoogleAuthStrategy } from "@/features/auth/hooks/useAuthActions";

interface LoginModalProps {
  setShowLoginModal: (show: boolean) => void;
}

export default function LoginModal({ setShowLoginModal }: LoginModalProps) {
  const { authActions } = useAuth();
  const { signIn, isLoading } = authActions;

  const handleGoogleLogin = async () => {
    await signIn(GoogleAuthStrategy);
  };

  // const handleKakaoLogin = async () => {
  //   await signIn(KakaoAuthStrategy);
  // };

  return (
    <div
      aria-label="로그인 모달"
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={() => setShowLoginModal(false)}
    >
      <div
        className="w-[400px] bg-[#483544] backdrop-blur-[10px] border border-white/50 rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">로그인</h3>
          <button
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all grid place-items-center"
            onClick={() => setShowLoginModal(false)}
            title="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <section aria-label="로그인 옵션">
          <p className="mb-4 text-sm text-gray-300 text-center">
            소셜 계정으로 간편하게 로그인하세요.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png"
                alt="Google logo"
                width={20}
                height={20}
                className="mr-3"
              />
              Google 계정으로 로그인
            </button>
            {/* <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full px-4 py-3 font-semibold text-black bg-[#FEE500] rounded-lg hover:bg-[#F0D900] transition-colors disabled:opacity-50"
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/KakaoTalk_logo.svg/1024px-KakaoTalk_logo.svg.png"
                alt="Kakao logo"
                width={20}
                height={20}
                className="mr-3"
              />
              카카오 계정으로 로그인
            </button> */}
          </div>
          {isLoading && (
            <p className="mt-4 text-sm text-center text-gray-400">
              로그인 중...
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
