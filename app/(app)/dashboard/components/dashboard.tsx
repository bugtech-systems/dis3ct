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



export default function DashboardPage({ dashboardData }: { dashboardData?: any }) {


    // const [dashboardData, setDashboardData] = useState({
    //   teamReach: 0,
    //   subscriptions: 0,
    //   contacts: 0,
    //   recentContacts: [],
    //   overviewChartData: [],
    // });

    // useEffect(() => {
    //   const fetchDashboardData = async () => {
    //     try {
    //       const response = await axios.get("/api/dashboard");
    //       setDashboardData(response.data);
    //     } catch (error) {
    //       console.error("Failed to fetch dashboard data", error);
    //     }
    //   };

    //   fetchDashboardData();
    // }, []);



    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                        {/* Team Reach */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Team Reach
                                </CardTitle>
                                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData?.teamReach}</div>
                            </CardContent>
                        </Card>

                        {/* Subscriptions */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Subscriptions
                                </CardTitle>
                                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.subscriptions}</div>
                            </CardContent>
                        </Card>

                        {/* My Contacts */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">My Contacts</CardTitle>
                                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <path d="M2 10h20" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.contacts}</div>
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
                                <Overview chartData={dashboardData.overviewChartData} />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recently Added</CardTitle>
                                <CardDescription>You saved {dashboardData.recentContacts.length} contacts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentSales contacts={dashboardData.recentContacts} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
