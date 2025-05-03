// app/(app)/dashboard/page.tsx
import { getLeaderDashboard } from "@/actions/getDashboard";
import DashboardPage from "./components/dashboard";
import { Suspense } from "react";

interface Props {
  searchParams: { team?: string };
}

export default async function DashboardPageWrapper({ searchParams }: Props) {
  const teamCode = searchParams?.team || "";
  const dashData = await getLeaderDashboard(teamCode);

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardPage data={dashData} />
    </Suspense>
  );
}
