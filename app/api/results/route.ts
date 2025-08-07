export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import Contact from "@/models/Contact";

let results = [
    {
        "brgyCode": "083742010",
        "total_voters": "1629",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 815
            },
            {
                "name": "VELOSO",
                "vote_count": 814
            }
        ]
    },
    {
        "brgyCode": "083742009",
        "total_voters": "1196",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 583
            },
            {
                "name": "VELOSO",
                "vote_count": 613
            }
        ]
    },
    {
        "brgyCode": "083742015",
        "total_voters": "577",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 170
            },
            {
                "name": "VELOSO",
                "vote_count": 407
            }
        ]
    },
    {
        "brgyCode": "083742004",
        "total_voters": "969",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 461
            },
            {
                "name": "VELOSO",
                "vote_count": 508
            }
        ]
    },
    {
        "brgyCode": "083742022",
        "total_voters": "596",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 204
            },
            {
                "name": "VELOSO",
                "vote_count": 392
            }
        ]
    },
    {
        "brgyCode": "083742021",
        "total_voters": "1107",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 378
            },
            {
                "name": "VELOSO",
                "vote_count": 729
            }
        ]
    },
    {
        "brgyCode": "083742020",
        "total_voters": "742",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 214
            },
            {
                "name": "VELOSO",
                "vote_count": 528
            }
        ]
    },
    {
        "brgyCode": "083742019",
        "total_voters": "643",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 300
            },
            {
                "name": "VELOSO",
                "vote_count": 343
            }
        ]
    },
    {
        "brgyCode": "083742018",
        "total_voters": "647",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 232
            },
            {
                "name": "VELOSO",
                "vote_count": 415
            }
        ]
    },
    {
        "brgyCode": "083742017",
        "total_voters": "752",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 245
            },
            {
                "name": "VELOSO",
                "vote_count": 507
            }
        ]
    },
    {
        "brgyCode": "083742014",
        "total_voters": "1034",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 72
            },
            {
                "name": "VELOSO",
                "vote_count": 962
            }
        ]
    },
    {
        "brgyCode": "083742013",
        "total_voters": "1175",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 561
            },
            {
                "name": "VELOSO",
                "vote_count": 614
            }
        ]
    },
    {
        "brgyCode": "083742011",
        "total_voters": "1229",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 342
            },
            {
                "name": "VELOSO",
                "vote_count": 887
            }
        ]
    },
    {
        "brgyCode": "083742012",
        "total_voters": "1052",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 548
            },
            {
                "name": "VELOSO",
                "vote_count": 504
            }
        ]
    },
    {
        "brgyCode": "083742001",
        "total_voters": "1511",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 724
            },
            {
                "name": "VELOSO",
                "vote_count": 787
            }
        ]
    },
    {
        "brgyCode": "083742005",
        "total_voters": "1800",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 835
            },
            {
                "name": "VELOSO",
                "vote_count": 965
            }
        ]
    },
    {
        "brgyCode": "083742003",
        "total_voters": "1682",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 861
            },
            {
                "name": "VELOSO",
                "vote_count": 821
            }
        ]
    },
    {
        "brgyCode": "083742006",
        "total_voters": "643",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 300
            },
            {
                "name": "VELOSO",
                "vote_count": 343
            }
        ]
    },
    {
        "brgyCode": "083742008",
        "total_voters": "657",
        "candidates": [
            {
                "name": "LABTIC",
                "vote_count": 310
            },
            {
                "name": "VELOSO",
                "vote_count": 347
            }
        ]
    }
]


// Define the tag values we're interested in counting
const TAG_VALUES = [
    "confirm",
    "verified",
    "unknown",
    "sure_voter",
    "voted",
    "undecided"
];

export const GET = async (req: NextRequest) => {
    try {
        await connectToDatabase();

        // Get session (optional based on your auth requirements)
        const session = await getServerSession(authOptions) as any;
        // if (!session?.user?.id) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // First, get all contacts grouped by brgyCode with their tags
        const contactsByBarangay = await Contact.aggregate([
            {
                $match: {
                    // Add any filters here if needed
                }
            },
            {
                $group: {
                    _id: "$brgyCode",
                    totalVoters: { $sum: 1 },
                    contacts: { $push: "$$ROOT" }
                }
            }
        ]);

        // Process each barangay to count tag values
        const efficiencyReport = contactsByBarangay.map(barangay => {
            const tagCounts: Record<string, number> = {};

            // Initialize counts for all tag values
            TAG_VALUES.forEach(value => {
                tagCounts[value] = 0;
            });

            // Count occurrences of each tag value
            barangay.contacts.forEach(contact => {
                const contactTags = contact.tags || [];
                const tagValues = new Set<string>();

                // Collect all tag values for this contact
                contactTags.forEach((tag: any) => {
                    if (tag.tagType === "tag" && TAG_VALUES.includes(tag.value)) {
                        tagValues.add(tag.value);
                    }
                });

                // Increment counts for each unique tag value
                tagValues.forEach(value => {
                    tagCounts[value]++;
                });
            });

            // Calculate derived metrics
            const funded = tagCounts["confirm"] || 0;
            const added = tagCounts["verified"] || 0;
            const sureVoters = tagCounts["sure_voter"] || 0;
            const missing = funded - (added + sureVoters);
            const declined = tagCounts["unknown"] || 0;
            const voted = tagCounts["voted"] || 0;

            return {
                brgyCode: barangay._id,
                totalVoters: barangay.totalVoters,
                tagCounts, // Include all tag counts
                funded,
                added,
                missing: Math.max(0, missing), // Ensure missing isn't negative
                declined,
                sureVoters,
                voted,
                efficiencyPercentage: barangay.totalVoters > 0
                    ? Math.round(((funded + added + sureVoters) / barangay.totalVoters) * 100)
                    : 0
            };
        });

        // Sort by efficiency percentage (highest first)
        efficiencyReport.sort((a, b) => b.efficiencyPercentage - a.efficiencyPercentage);

        return NextResponse.json(efficiencyReport, { status: 200 });
    } catch (error: any) {
        console.error('Error generating efficiency report:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
};