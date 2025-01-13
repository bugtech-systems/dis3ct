import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function authenticate() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/login");
}

export default async function Private() {
  await authenticate();

  

  return redirect('/dashboard')
}
