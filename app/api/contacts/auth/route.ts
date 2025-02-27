import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const GET = async (req: NextRequest) => {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions) as any;
        // console.log(session, 'SESS')
        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const phone = session.user.phone;
        const userId = session.user.id;

        console.log(userId, phone, 'AUTH CONTACT')
        const contact = await User.findById(userId).populate({
            path: 'parNum',
            options: { strictPopulate: false } // Allows missing `parNum` without errors
        });

        if (!contact) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }


        return NextResponse.json(
            contact,
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
};
