import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Overview } from "@/app/(app)/dashboard/components/overview";
import { RecentSales } from "@/app/(app)/dashboard/components/recent-sales";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";
import getLeaderDashboard from "@/actions/getDashboard";
import getAuth from "@/actions/getAuth";
import DashboardPage from "./components/dashboard";

// async function authenticate() {
//   const session = await getServerSession(authOptions);


//   if (!session) return redirect('/login'); // Redirects the user to "/login" after logging out
// }

export default async function Page() {
  // await authenticate();
  // let authUser = await getAuth();
  // console.log(authUser, 'AUTH USER')
  let authUser = await getAuth();
  console.log(authUser, 'AUTH USER')

  if (!authUser) {
    // signOut()
    return redirect('/login')
  }


  const dashboardData = await getLeaderDashboard();


  return (
    <>
      <DashboardPage
        dashboardData={dashboardData}
      />
    </>

  );
}
