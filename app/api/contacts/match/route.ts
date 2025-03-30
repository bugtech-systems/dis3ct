import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";

// Function to calculate Euclidean distance between two vectors
function euclideanDistance(arr1: number[], arr2: number[]): number {
    return Math.sqrt(arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0));
}

export async function POST(
    req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { descriptor } = await req.json();

        if (!descriptor) {
            return NextResponse.json({ error: "No face detected" }, { status: 400 });
        }
        console.log(descriptor, 'DESC')

        const float32Array = new Float32Array(Object.values(descriptor));

        // Convert Float32Array to regular array
        const descriptorArray = Array.from(float32Array);


        await dbConnect();

        if (descriptorArray) {
            const queryDescriptor = descriptorArray;

            // Retrieve all face descriptors from MongoDB
            const allDescriptors = await Contact.find({ descriptor: { $exists: true, $ne: null } });

            let bestMatch = null;
            let lowestDistance = 0.6;

            allDescriptors.forEach(doc => {
                const distance = euclideanDistance(queryDescriptor, doc.descriptor);
                if (distance < lowestDistance) {
                    lowestDistance = distance;
                    bestMatch = doc;
                }
            });

            if (bestMatch) {
                console.log(`Best match found: User ID ${bestMatch} with distance ${lowestDistance}`);
                return NextResponse.json({ message: "Match Found", data: bestMatch, match: true });
            } else {
                return NextResponse.json({ message: "No match found", match: false });
            }
        } else {
            return NextResponse.json({ message: "No Face ", match: false });
        }
    } catch (error) {
        return NextResponse.json(error, { status: 500 });
    }
}
