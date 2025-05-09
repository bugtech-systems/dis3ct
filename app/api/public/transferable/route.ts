import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import User from "@/models/User";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("parent") || "";

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "Record not found!" }, { status: 404 });
        }

        const pipeline = [
            {
                $facet: {
                    imageContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "image", sync: { $in: [null, "", false] } } }
                            }
                        },
                        { $project: { name: 1, tags: { $slice: ["$tags", 5] }, _id: 1 } }, // Limit tags returned
                        { $limit: 500 } // Prevent too large response
                    ],
                    biometricContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "biometrics", sync: { $in: [null, "", false] } } }
                            }
                        },
                        { $project: { name: 1, tags: { $slice: ["$tags", 5] }, _id: 1, biometric: 1 } },
                        { $limit: 500 }
                    ],
                    tagContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "tag", sync: { $in: [null, "", false] } } }
                            }
                        },
                        { $project: { name: 1, tags: { $slice: ["$tags", 5] }, _id: 1 } },
                        { $limit: 500 }
                    ]
                }
            }
        ];

        const result = await Contact.aggregate(pipeline);

        return NextResponse.json(
            {
                image: result[0]?.imageContacts || [],
                biometric: result[0]?.biometricContacts || [],
                tag: result[0]?.tagContacts || []
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[CONTACTS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
