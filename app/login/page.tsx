import { LoginForm } from "@/components/login/login-form"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

async function authenticationPrecheck(): Promise<void> {
  const session = await getServerSession(authOptions);
  console.log(session, 'SESSS')
  if (session?.user) return redirect("/dashboard")
}

export default async function LoginPage() {
  // await authenticationPrecheck()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
