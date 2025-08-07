export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import Contact from "@/models/Contact";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";

const results = [
    {
        "brgyCode": "083742010",
        "totalVotes": 1629,
        "labtic": 815,
        "veloso": 814
    },
    {
        "brgyCode": "083742009",
        "totalVotes": 1196,
        "labtic": 583,
        "veloso": 613
    },
    {
        "brgyCode": "083742015",
        "totalVotes": 577,
        "labtic": 170,
        "veloso": 407
    },
    {
        "brgyCode": "083742004",
        "totalVotes": 969,
        "labtic": 461,
        "veloso": 508
    },
    {
        "brgyCode": "083742022",
        "totalVotes": 596,
        "labtic": 204,
        "veloso": 392
    },
    {
        "brgyCode": "083742021",
        "totalVotes": 1107,
        "labtic": 378,
        "veloso": 729
    },
    {
        "brgyCode": "083742020",
        "totalVotes": 742,
        "labtic": 214,
        "veloso": 528
    },
    {
        "brgyCode": "083742019",
        "totalVotes": 643,
        "labtic": 300,
        "veloso": 343
    },
    {
        "brgyCode": "083742018",
        "totalVotes": 647,
        "labtic": 232,
        "veloso": 415
    },
    {
        "brgyCode": "083742017",
        "totalVotes": 752,
        "labtic": 245,
        "veloso": 507
    },
    {
        "brgyCode": "083742014",
        "totalVotes": 1034,
        "labtic": 72,
        "veloso": 962
    },
    {
        "brgyCode": "083742013",
        "totalVotes": 1175,
        "labtic": 561,
        "veloso": 614
    },
    {
        "brgyCode": "083742011",
        "totalVotes": 1229,
        "labtic": 342,
        "veloso": 887
    },
    {
        "brgyCode": "083742012",
        "totalVotes": 1052,
        "labtic": 548,
        "veloso": 504
    },
    {
        "brgyCode": "083742001",
        "totalVotes": 1511,
        "labtic": 724,
        "veloso": 787
    },
    {
        "brgyCode": "083742005",
        "totalVotes": 1800,
        "labtic": 835,
        "veloso": 965
    },
    {
        "brgyCode": "083742003",
        "totalVotes": 1682,
        "labtic": 861,
        "veloso": 821
    },
    {
        "brgyCode": "083742006",
        "totalVotes": 643,
        "labtic": 300,
        "veloso": 343
    },
    {
        "brgyCode": "083742008",
        "totalVotes": 657,
        "labtic": 310,
        "veloso": 347
    }
];


let otherResults = [
    {
        "brgyCode": "083742003",
        "totalVoters": 1959,
        "ramanDabanBimBim": 786,
        "velosoChinggay": 802,
        "angAlan": 843,
        "velosoTuazonAnna": 825,
        "velosoWingWing": 833
    },
    {
        "brgyCode": "083742012",
        "totalVoters": 1227,
        "ramanDabanBimBim": 457,
        "velosoChinggay": 525,
        "angAlan": 568,
        "velosoTuazonAnna": 522,
        "velosoWingWing": 504
    },
    {
        "brgyCode": "083742004",
        "totalVoters": 1112,
        "ramanDabanBimBim": 448,
        "velosoChinggay": 432,
        "angAlan": 494,
        "velosoTuazonAnna": 435,
        "velosoWingWing": 514
    },
    {
        "brgyCode": "083742009",
        "totalVoters": 1427,
        "ramanDabanBimBim": 512,
        "velosoChinggay": 550,
        "angAlan": 694,
        "velosoTuazonAnna": 554,
        "velosoWingWing": 617
    },
    {
        "brgyCode": "083742001",
        "totalVoters": 1778,
        "ramanDabanBimBim": 638,
        "velosoChinggay": 701,
        "angAlan": 699,
        "velosoTuazonAnna": 685,
        "velosoWingWing": 781
    },
    {
        "brgyCode": "083742010",
        "totalVoters": 1874,
        "ramanDabanBimBim": 741,
        "velosoChinggay": 737,
        "angAlan": 793,
        "velosoTuazonAnna": 760,
        "velosoWingWing": 823
    },
    {
        "brgyCode": "083742019",
        "totalVoters": 737,
        "ramanDabanBimBim": 309,
        "velosoChinggay": 380,
        "angAlan": 295,
        "velosoTuazonAnna": 296,
        "velosoWingWing": 332
    },
    {
        "brgyCode": "083742013",
        "totalVoters": 1380,
        "ramanDabanBimBim": 573,
        "velosoChinggay": 542,
        "angAlan": 560,
        "velosoTuazonAnna": 530,
        "velosoWingWing": 617
    },
    {
        "brgyCode": "083742008",
        "totalVoters": 752,
        "ramanDabanBimBim": 318,
        "velosoChinggay": 299,
        "angAlan": 302,
        "velosoTuazonAnna": 303,
        "velosoWingWing": 352
    },
    {
        "brgyCode": "083742005",
        "totalVoters": 2071,
        "ramanDabanBimBim": 887,
        "velosoChinggay": 796,
        "angAlan": 833,
        "velosoTuazonAnna": 808,
        "velosoWingWing": 966
    },
    {
        "brgyCode": "083742021",
        "totalVoters": 1310,
        "ramanDabanBimBim": 628,
        "velosoChinggay": 357,
        "angAlan": 392,
        "velosoTuazonAnna": 360,
        "velosoWingWing": 720
    },
    {
        "brgyCode": "083742006",
        "totalVoters": 775,
        "ramanDabanBimBim": 375,
        "velosoChinggay": 256,
        "angAlan": 257,
        "velosoTuazonAnna": 253,
        "velosoWingWing": 372
    },
    {
        "brgyCode": "083742018",
        "totalVoters": 764,
        "ramanDabanBimBim": 368,
        "velosoChinggay": 220,
        "angAlan": 229,
        "velosoTuazonAnna": 228,
        "velosoWingWing": 416
    },
    {
        "brgyCode": "083742022",
        "totalVoters": 695,
        "ramanDabanBimBim": 369,
        "velosoChinggay": 195,
        "angAlan": 207,
        "velosoTuazonAnna": 196,
        "velosoWingWing": 373
    },
    {
        "brgyCode": "083742020",
        "totalVoters": 868,
        "ramanDabanBimBim": 503,
        "velosoChinggay": 206,
        "angAlan": 208,
        "velosoTuazonAnna": 200,
        "velosoWingWing": 523
    },
    {
        "brgyCode": "083742017",
        "totalVoters": 879,
        "ramanDabanBimBim": 469,
        "velosoChinggay": 231,
        "angAlan": 251,
        "velosoTuazonAnna": 240,
        "velosoWingWing": 504
    },
    {
        "brgyCode": "083742015",
        "totalVoters": 637,
        "ramanDabanBimBim": 380,
        "velosoChinggay": 165,
        "angAlan": 178,
        "velosoTuazonAnna": 168,
        "velosoWingWing": 409
    },
    {
        "brgyCode": "083742011",
        "totalVoters": 1442,
        "ramanDabanBimBim": 756,
        "velosoChinggay": 343,
        "angAlan": 364,
        "velosoTuazonAnna": 335,
        "velosoWingWing": 866
    },
    {
        "brgyCode": "083742014",
        "totalVoters": 1180,
        "ramanDabanBimBim": 859,
        "velosoChinggay": 74,
        "angAlan": 87,
        "velosoTuazonAnna": 63,
        "velosoWingWing": 957
    }
]


export const GET = async (req: NextRequest) => {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions) as any;
        // Add auth check if needed

        // Get all contacts grouped by barangay
        const contactsByBarangay = await Contact.aggregate([
            {
                $group: {
                    _id: "$brgyCode",
                    totalVoters: { $sum: 1 },
                    contacts: { $push: "$$ROOT" }
                }
            }
        ]);

        // Process each barangay
        const efficiencyReport = contactsByBarangay.map(barangay => {
            let funded = 0;
            let added = 0;
            let missing = 0;
            let declined = 0;
            let voted = 0;
            let verified = 0;
            const tagCounts: Record<string, number> = {};

            barangay.contacts.forEach(contact => {
                const tags = contact.tags || [];
                const tagValues = tags.filter(t => t.tagType === "tag").map(t => t.value);

                // Count all tag types
                tagValues.forEach(value => {
                    tagCounts[value] = (tagCounts[value] || 0) + 1;
                });

                // Check for specific tags
                const hasConfirm = tagValues.includes("confirm");
                const hasVerified = tagValues.includes("verified");
                const hasSureVoter = tagValues.includes("sure_voter");
                const hasVoted = tagValues.includes("voted");
                const hasUnknown = tagValues.includes("unknown");
                const hasDeclined = tagValues.includes("declined");

                // Count funded (has confirm tag)
                if (hasConfirm) funded++;

                // Count added (has verified/sure_voter but no confirm)
                if ((hasVerified || hasSureVoter) && !hasConfirm) added++;
                if (hasConfirm && (hasVerified || hasSureVoter || hasVoted)) verified++;

                // Count missing (has confirm but no verified or sure_voter)
                if (hasConfirm && !hasVerified && !hasSureVoter) missing++;

                // Count declined (has unknown tag)
                if (hasUnknown || hasDeclined) declined++;

            });

            const barName = barangays.find((b) => b.brgyCode === barangay._id)?.brgyDesc;
            const result = results.find(b => b.brgyCode === barangay._id);
            const moreResult = otherResults.find(c => c.brgyCode === barangay._id);
            console.log(moreResult, "RES")
            return {
                barangay: barName,
                totalVoters: barangay.totalVoters,
                funded,
                verified,
                added,
                total: verified + added,
                mayoral: {
                    votes: result?.labtic,
                    efficiency: ((result?.labtic / (verified + added)) * 100).toFixed(2),
                    missing,
                    missingRate: ((missing / funded) * 100).toFixed(2),
                    labtic: result?.labtic,
                    bebot: result?.veloso,
                    mayoria: result?.veloso - result?.labtic
                },
                congressional: {
                    votes: moreResult?.velosoTuazonAnna,
                    efficiency: ((moreResult?.velosoTuazonAnna / (verified + added)) * 100).toFixed(2),
                    missing,
                    missingRate: ((missing / funded) * 100).toFixed(2),
                    anna: moreResult?.velosoTuazonAnna,
                    wing: moreResult?.velosoWingWing,
                    mayoria: moreResult?.velosoWingWing - moreResult?.velosoTuazonAnna
                },
                board_member_allan: {
                    votes: moreResult?.angAlan,
                    efficiency: ((moreResult?.angAlan / (verified + added)) * 100).toFixed(2),
                    missing,
                    missingRate: ((missing / funded) * 100).toFixed(2),
                    allan: moreResult?.angAlan,
                    bimbim: moreResult?.ramanDabanBimBim,
                    mayoria: moreResult?.ramanDabanBimBim - moreResult?.angAlan
                },
                board_member_chingay: {
                    votes: moreResult?.velosoChinggay,
                    efficiency: ((moreResult?.velosoChinggay / (verified + added)) * 100).toFixed(2),
                    missing,
                    missingRate: ((missing / funded) * 100).toFixed(2),
                    chingay: moreResult?.velosoChinggay,
                    bimbim: moreResult?.ramanDabanBimBim,
                    mayoria: moreResult?.ramanDabanBimBim - moreResult?.velosoChinggay
                },

                tagCounts, // Includes counts for all tag types
            };
        });

        // Sort by efficiency percentage (highest first)
        // efficiencyReport.sort((a, b) => b.metrics.efficiencyPercentage - a.metrics.efficiencyPercentage);
        efficiencyReport.sort((a, b) => a.barangay.localeCompare(b.barangay));


        return NextResponse.json(efficiencyReport, { status: 200 });
    } catch (error: any) {
        console.error('Error generating efficiency report:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
};