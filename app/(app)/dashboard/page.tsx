"use client";

import { useEffect, useState, useCallback } from "react";
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
import { useContact } from "@/components/providers/ContactProvider";
import { getLeaderDashboard } from "@/actions/getDashboard";

export default function DashboardPage() {
  const { user, system } = useContact();

  const [dashboardData, setDashboardData] = useState({
    teamReach: 0,
    subscriptions: 0,
    contacts: 0,
    recentContacts: [],
    overviewChartData: [],
  });

  // Memoized function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!system || !user) return;

    try {
      const dashData = await getLeaderDashboard(user?._id);

      // Only update state if data actually changes
      setDashboardData((prevData) => {
        return JSON.stringify(prevData) !== JSON.stringify(dashData)
          ? dashData
          : prevData;
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  }, [system, user]);


  // Fetch dashboard data when user changes
  useEffect(() => {
    fetchDashboardData();
  }, [system, fetchDashboardData]);


  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Team Reach */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.teamReach}</div>
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.subscriptions}</div>
              </CardContent>
            </Card>

            {/* My Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.contacts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart & Recent Contacts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview chartData={dashboardData?.overviewChartData} />
              </CardContent>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
