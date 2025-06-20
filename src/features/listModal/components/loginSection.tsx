import { useAuth } from "@/shared/providers/authProvider";
import { useState } from "react";
import LoginModal from "../../../shared/components/loginModal";
import ShareModal from "../../../shared/components/shareModal";
import ReusableTooltip from "../../../shared/components/myTooltip";

export default function LoginSection() {
  const { user, isLoadingSession, authActions } = useAuth();
  const { signOut } = authActions;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      {showLoginModal && <LoginModal setShowLoginModal={setShowLoginModal} />}
      {showShareModal && <ShareModal setShowShareModal={setShowShareModal} />}
      <section
        aria-label="사용자 인증"
        className="w-full flex items-center justify-center z-10 min-h-[40px] mt-4"
      >
        {isLoadingSession ? (
          <div className="px-3 py-1.5 text-sm text-gray-300 bg-white/10 rounded-lg">
            로딩 중...
          </div>
        ) : user ? (
          <div className="w-full flex items-center justify-between px-3 py-1 bg-white/10 rounded-lg">
            <div>
              <span title={user.email || undefined}>
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email ||
                  "사용자"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <ReusableTooltip
                tooltipText="You need to Login!"
                showTooltip={!user}
              >
                <button
                  disabled={!user}
                  className="px-3 py-1 text-sm text-gray-300 hover:text-blue-400 bg-white/10 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowShareModal(true)}
                >
                  <span className="relative z-10 flex items-center space-x-1">
                    <span>↗</span>
                    <span>Share</span>
                  </span>
                </button>
              </ReusableTooltip>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    console.error("Sign out failed", error);
                  }
                }}
                className="px-3 py-1 text-sm bg-pink-600/80 hover:bg-pink-700/80 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Login
          </button>
        )}
      </section>
    </>
  );
}
