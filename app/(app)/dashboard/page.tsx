"use client";

import { useEffect, useState, useCallback } from "react";
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
import { useContact } from "@/components/providers/ContactProvider";
import { getLeaderDashboard } from "@/actions/getDashboard";
import { findFeature } from "@/lib/helpers";
import { BarangayChart } from "@/components/barangayChart";
import { ChartProvider } from "@/components/ui/chart";
import axios from "axios";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { user, system, parentSystem, setSystem, setParentSystem } = useContact();
  const [dashboardData, setDashboardData] = useState({
    teamReach: 0,
    subscriptions: 0,
    contacts: 0,
    recentContacts: [],
    overviewChartData: [],
    barangay: {},
  });
  const teamCode = searchParams.get("team");


  // Fetch dashboard for selected system
  const fetchDashboardData = useCallback(async () => {
    if (!parentSystem || !user) return;

    try {

      
      const dashData = await getLeaderDashboard(teamCode);
      setDashboardData((prevData) =>
        JSON.stringify(prevData) !== JSON.stringify(dashData) ? dashData : prevData
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  }, [parentSystem, user]);

  // Check for `team` param in URL and set context accordingly
  useEffect(() => {

    const fetchAndSetTeam = async (code: string) => {
        try {

      
          const dashData = await getLeaderDashboard(teamCode);
          setDashboardData((prevData) =>
            JSON.stringify(prevData) !== JSON.stringify(dashData) ? dashData : prevData
          );
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        }
      }

    if (teamCode) {
      fetchAndSetTeam(teamCode);
    }
  }, [teamCode]);

  useEffect(() => {
    fetchDashboardData();
  }, [parentSystem, fetchDashboardData]);

  // Optional: auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 1000 * 60 * 10);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const parent = parentSystem?.parent ?? user?.parent;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {/* Team Reach */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.teamReach}</div>
              </CardContent>
            </Card>

            {/* My Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actual Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.contacts}</div>
              </CardContent>
            </Card>

            {/* Subscriptions */}
            {parent && findFeature(parent?.configs, "sms")?.value && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.subscriptions}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chart & Recent Contacts */}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
