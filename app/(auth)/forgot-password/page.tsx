import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormShell } from "@/components/auth/AuthFormShell";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthFormShell mode="forgot" />
    </Suspense>
  );
}
