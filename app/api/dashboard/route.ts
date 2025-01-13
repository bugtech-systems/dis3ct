import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";

export const GET = async (req: NextRequest) => {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as any;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;


console.log(userId, 'USERID')

    // Fetching Data from MongoDB
    const teamReach = await Contact.countDocuments({ deletedAt: null });
    const subscriptions = await Contact.countDocuments({ subscribed: true, deletedAt: null });
    const contacts = await Contact.countDocuments({ refNum: userId, deletedAt: null });

    // Fetch 5 recent contacts
    const recentContacts = await Contact.find({ refNum: userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name phone");

    // Generate Dummy Chart Data
    const overviewChartData = [
      { name: "Jan", total: 1500 },
      { name: "Feb", total: 1000 },
      { name: "Mar", total: 2000 },
      { name: "Apr", total: 3500 },
      { name: "May", total: 4000 },
      { name: "Jun", total: 5000 },
      { name: "Jul", total: 2500 },
      { name: "Aug", total: 6000 },
      { name: "Sep", total: 4500 },
      { name: "Oct", total: 3000 },
      { name: "Nov", total: 3200 },
      { name: "Dec", total: 3700 },
    ];

    return NextResponse.json({ teamReach, subscriptions, contacts, recentContacts, overviewChartData });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
