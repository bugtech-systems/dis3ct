// app/(app)/dashboard/page.tsx
import { getLeaderDashboard } from "@/actions/getDashboard";
import DashboardPage from "./components/dashboard";
import { Suspense } from "react";
import SocketRedirector from "@/components/socketRedirector";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { team?: string };
}

export default async function DashboardPageWrapper({ searchParams }: Props) {
  // const teamCode = searchParams?.team || "";
  // const dashData = await getLeaderDashboard(teamCode);

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <SocketRedirector />
      <DashboardPage />
    </Suspense>
  );
}
