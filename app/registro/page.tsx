import { AnimatedBackground } from "@/components/auth/animated-background";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="glass-subtle rounded-2xl p-8 md:p-10 w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  );
}
