import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase(); // Ensure MongoDB connection

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("parent") || "";

        let user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ message: 'Record not found!' }, { status: 404 });
        }

        // Define the aggregation pipeline
        const pipeline = [
            {
                $facet: {
                    imageContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "image", sync: { $in: [null, "", false] } } },
                                // descriptor: { $in: [null, "", []] },
                                // parNum: user?._id
                            }
                        }
                    ],
                    biometricContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "biometrics", sync: { $in: [null, "", false] } } },
                                // biometric: { $in: [null, ""] },
                                // parNum: user?._id
                            }
                        }
                    ],
                    tagContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "tag", sync: { $in: [null, "", false] } } },
                                // biometric: { $in: [null, ""] },
                                // parNum: user?._id
                            }
                        }
                    ]
                }
            }
        ];



        // Execute the aggregation pipeline
        const result = await Contact.aggregate(pipeline);

        // Extract the arrays from the result
        const imageContacts = result[0]?.imageContacts || [];
        const newContacts = result[0]?.biometricContacts || [];



        return NextResponse.json(
            {
                image: imageContacts,
                biometric: newContacts,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[CONTACTS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
