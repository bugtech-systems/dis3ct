"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { RecentSales } from "@/app/(app)/dashboard/components/recent-sales";
import { BarangayChart } from "@/components/barangayChart";
import { ChartProvider } from "@/components/ui/chart";
import axios from "axios";

export default function DashboardPage({ data }: any) {
  const [dashboardData, setDashboardData] = useState({
    teamReach: 0,
    contacts: 0,
    barangay: {},
    target: 0,
    recentContacts: [],
  });

  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const team = searchParams.get("team");
  const tag = searchParams.get("tag");

  const fetchDashboardData = async () => {
    if (loading) return; // Prevent duplicate fetches

    setLoading(true);
    try {
      const response = await axios.get(`/api/dashboard`, {
        params: { parent: team, tag },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tag, team]); // Ensure fetch on both tag + team change

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              Loading dashboard data...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.teamReach}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Target Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.target}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Actual Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.contacts}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-full">
                <Card className="col-span-4">
                  <ChartProvider>
                    <BarangayChart data={dashboardData.barangay || {}} />
                  </ChartProvider>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recently Updated</CardTitle>
                    <CardDescription>
                      You saved {dashboardData?.recentContacts?.length} contacts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales contacts={dashboardData?.recentContacts} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
