
import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import getLeaderDashboard from "@/actions/getDashboard";
// import { withAuth } from '@/lib/withAuth';



export const GET = async (req: NextRequest) => {
    try {
        await connectToDatabase();


        const session = await getServerSession(authOptions) as any;
        const { searchParams } = new URL(req.url) as any;
        let systemParam = searchParams.get("parent");
        let user = searchParams.get("user");

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // const phone = session.user.phone;
        // const userId = session.user.id;

        await connectToDatabase()

        let dashboardDdata = await getLeaderDashboard(user ?? systemParam);




        // console.log(contacts, 'CONTACTSssss')
        return NextResponse.json(dashboardDdata, { status: 200 });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}