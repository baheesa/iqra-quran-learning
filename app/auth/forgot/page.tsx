import { AuthForm } from "@/features/auth/components/AuthForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <AuthForm mode="forgot" />
    </main>
  );
}
