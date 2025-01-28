import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import getAuth from "@/actions/getAuth";
import { signOut } from "next-auth/react";

async function authenticate() {
  const session = await getServerSession(authOptions);
  console.log(session, 'SESSSS')
  if (!session) return redirect('/login'); // Redirects the user to "/login" after logging out
}
export default async function Private() {
  await authenticate();
  let authUser = await getAuth();

  if (authUser) {
    return redirect('/dashboard')
  } else {
    // signOut()
    return redirect('/login')
  }
}
