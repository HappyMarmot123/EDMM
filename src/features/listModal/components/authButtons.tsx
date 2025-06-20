"use client"; // 클라이언트 컴포넌트로 명시

import { useAuth } from "@/shared/providers/authProvider";

export default function AuthButtons() {
  const { user, isLoadingSession, authActions } = useAuth();
  const { signIn, signOut, GoogleAuthStrategy } = authActions;

  if (isLoadingSession) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <button
          onClick={signOut}
          className="px-4 py-2 font-semibold text-white bg-red-500 rounded hover:bg-red-600"
        >
          Sign out
        </button>
      ) : (
        <button
          onClick={() => signIn(GoogleAuthStrategy)}
          className="px-4 py-2 font-semibold text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
