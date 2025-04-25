import { formatVoterSms, sanitizePhoneNumber, updateOrPushObject } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import axios from "axios";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import { logAction } from "@/services/auditLogsService";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";

let apiUrl = process.env.TASK_URL || `http://localhost:3000/api/tasks`

export const POST = async (req: NextRequest) => {
    try {

        await connectToDatabase();


        const data = await req.json();

        if (!data?.phone) return new NextResponse("Phone Not Found", { status: 404 })
        if (!data?.system) return new NextResponse("System Not Found", { status: 404 })

        let { phone, system } = data;

        let phoneSystem = sanitizePhoneNumber(system)
        let newPhone = sanitizePhoneNumber(phone);
        let newSystem = await User.findOne({ phone: phoneSystem });
        if (!newSystem) return new NextResponse("System Not Found", { status: 404 })



        let oldRecord = await Mobile.findOne({ phone: newPhone, system: phoneSystem })

        if (oldRecord) return new NextResponse("Already Exist!", { status: 400 })


        await Mobile.create({
            phone: newPhone,
            system: sanitizePhoneNumber(newSystem.phone)
        })

        return NextResponse.json({ message: 'Mobile Saved!' }, { status: 200 });

    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = async (req: NextRequest) => {
    try {

        const { searchParams } = new URL(req.url) as any;
        let systemParam = searchParams.get("system");

        if (!systemParam) return new NextResponse("System Not Found", { status: 404 })


        const results = await Mobile.find({ system: sanitizePhoneNumber(systemParam) });





        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
};




