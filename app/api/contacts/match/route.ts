import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import User from "@/models/User";
// Function to calculate Euclidean distance between two vectors
function euclideanDistance(arr1: number[], arr2: number[]): number {
    return Math.sqrt(arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0));
}

export async function POST(
    req: NextRequest) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        // Fetch user to determine access level
        const userId = session.user.id;
        let user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }



        const { descriptor, parent, teamCode } = await req.json();



        if (!descriptor) {
            return NextResponse.json({ error: "No face detected" }, { status: 400 });
        }

        const float32Array = new Float32Array(Object.values(descriptor));

        // Convert Float32Array to regular array
        const descriptorArray = Array.from(float32Array);



        if (descriptorArray) {
            const queryDescriptor = descriptorArray;
            const options = String(teamCode).length > 6 ? { brgyCode: teamCode } : { parNum: parent }
            // Retrieve all face descriptors from MongoDB
            const allDescriptors = await Contact.find({ descriptor: { $exists: true, $ne: null }, ...options }).lean();

            let bestMatch = [] as any;
            let lowestDistance = 0.48;


            let newData = allDescriptors.map((contact: any) => {
                const barangay = barangays.find((b) => b.brgyCode === contact.brgyCode)?.brgyDesc;
                const citymun = municipalities.find((c) => c.citymunCode === contact.citymunCode)?.citymunDesc;
                const province = provinces.find((p) => p.provCode === contact.provCode)?.provDesc;
                const region = regions.find((r) => r.regCode === contact.regCode)?.regDesc;
                let tags = contact?.tags ? (user.userType == 'system' || user.userType == 'admin') ? contact.tags.sort((a, b) => b.timestamp - a.timestamp) : contact.tags.filter(a => String(a.user) == String(user._id)).sort((a, b) => b.timestamp - a.timestamp) : []

                let tagContact = tags.filter(a => a.tagType == 'tag').sort((a, b) => b.timestamp - a.timestamp)
                const tagPhone = tags.find(a => { return (a.tagType == 'phone' && String(a.user) == String(user._id)) })?.value
                return {
                    _id: contact._id,
                    name: contact.name,
                    phone: tagPhone,
                    address: contact.address,
                    marker: contact.marker,
                    precinct: contact.precinct,
                    brgyCode: contact.brgyCode,
                    citymunCode: contact.citymunCode,
                    barangay,
                    citymun,
                    province,
                    region,
                    biometric: contact.biometric,
                    recordType: contact.recordType,
                    school: contact.school,
                    tags: tags,
                    tag: tagContact.length ? tagContact[0].value : 'unknown',
                    subscribed: contact.subscribed,
                    descriptor: contact.descriptor
                };
            })











            newData.forEach(doc => {
                const distance = euclideanDistance(queryDescriptor, doc.descriptor);
                if (!isNaN(distance)) {
                    console.log(distance, 'DISt');
                }
                if (distance < lowestDistance) {
                    lowestDistance = distance;
                    bestMatch.push(doc);
                }
            });

            if (bestMatch.length) {
                console.log(`Best match found: ${bestMatch.length} with distance ${lowestDistance}`);
                return NextResponse.json({ message: "Match Found", data: bestMatch, match: true });
            } else {
                return NextResponse.json({ message: "No match found", match: false });
            }
        } else {
            return NextResponse.json({ message: "No Face", match: false });
        }
    } catch (error) {
        console.log(error)
        return NextResponse.json(error, { status: 500 });
    }
}
