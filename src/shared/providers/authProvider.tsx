"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type Session,
  type User,
  type AuthChangeEvent,
  type Subscription,
} from "@supabase/supabase-js";
import { supabaseClient } from "@/app/api/supabase/supabaseClient";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { AuthProviderProps, AuthContextType } from "@/shared/types/dataType";

/* 
  TODO: 
  Supabase Auth Google Login
  어떤 블로거가 설명을 되게 잘해주심
  https://mycodings.fly.dev/blog/2025-01-01-nextjs-supabase-tutorial-2-login-with-google-id-oauth
*/

/* 
  TODO:
   역할 변경 패턴
   사용자 권한에 따라 반환하는 객체가 달라지며 이를 이용하여 Protected Route 구현이 가능한데
   자식 children 컴포넌트를 권한에 따라 렌더링 유무를 결정하는 패턴으로 사용 가능
   현재는 정말 간단하게 사용중
*/

const ROLES = {
  viewer: {
    role: "viewer",
    favoriteInteract: false,
  },
  user: {
    role: "user",
    favoriteInteract: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Record<string, any>>(ROLES.viewer);

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const authActions = useAuthActions();

  useEffect(() => {
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setRole(currentSession?.user ? ROLES.user : ROLES.viewer);
        setIsLoadingSession(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    role,
    isLoadingSession,
    setSession,
    authActions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
