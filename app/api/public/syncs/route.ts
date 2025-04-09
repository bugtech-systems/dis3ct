import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase(); // Ensure MongoDB connection

        // Define the aggregation pipeline
        const pipeline = [
            {
                $facet: {
                    imageContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "image" } },
                                descriptor: null
                            }
                        }
                    ],
                    biometricContacts: [
                        {
                            $match: {
                                tags: { $elemMatch: { tagType: "biometrics" } },
                                biometric: { $in: [null, ""] }
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
        const biometricContacts = result[0]?.biometricContacts || [];

        return NextResponse.json(
            {
                image: imageContacts,
                biometric: biometricContacts
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[CONTACTS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
