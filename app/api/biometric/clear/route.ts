import { NextRequest, NextResponse } from "next/server";
import Contact from "@/models/Contact";
import Fingerprint from "@/models/fingerprints";

export const POST = async (req: NextRequest) => {
    try {
        const data = await req.json()
        let { parent } = data;

        let contacts = await Contact.updateMany(
            {
                descriptor: { $exists: true },
                biometric: { $exists: true },
                parNum: parent
            },
            {
                $unset: {
                    descriptor: "",
                    biometric: ""
                }
            }
        );

        await Fingerprint.deleteMany({
            user_id: { $exists: true },
        })

        return NextResponse.json(contacts, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
};
