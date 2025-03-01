
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { getLeaderDashboard } from "@/actions/getDashboard";
// import { withAuth } from '@/lib/withAuth';



export const GET = async (req: NextRequest) => {
    try {
        await connectToDatabase();


        const session = await getServerSession(authOptions) as any;
        const { searchParams } = new URL(req.url) as any;
        let systemParam = searchParams.get("parent");

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // const phone = session.user.phone;
        const userId = session.user.id;

        // await connectToDatabase()
        let dashboardDdata = await getLeaderDashboard(systemParam ? systemParam : userId);




        return NextResponse.json(dashboardDdata, { status: 200 });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}