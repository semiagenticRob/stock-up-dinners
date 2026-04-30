import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormShell } from "@/components/auth/AuthFormShell";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthFormShell mode="login" />
    </Suspense>
  );
}
