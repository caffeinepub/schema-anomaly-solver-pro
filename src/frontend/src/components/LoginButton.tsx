import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut, User } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleAuth}
      disabled={isLoggingIn}
      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-mono transition-all duration-200 ${
        isAuthenticated ? "btn-cyan" : "btn-neon"
      } disabled:opacity-50`}
    >
      {isLoggingIn ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isAuthenticated ? (
        <LogOut size={14} />
      ) : (
        <LogIn size={14} />
      )}
      {isLoggingIn ? "Connecting..." : isAuthenticated ? "Logout" : "Login"}
    </button>
  );
}
