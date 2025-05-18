"use server";

import { sanitizeObject } from "@/lib/helpers";
import connectToDatabase from "@/lib/mongodb";
import AuditLogs from "@/models/AuditLogs";
import Contact from "@/models/Contact";
import User from "@/models/User";
import { barangays } from "@/lib/locationData";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const getLeaderDashboard = async ({ id, allTags, tag }: any): Promise<any> => {
  try {
    const session = await getServerSession(authOptions) as any;
    const userId = session?.user?.id;

    await connectToDatabase();

    const isSession = String(id).length < 10 || session;
    const user = await User.findById((isSession && userId) ? userId : id).lean();

    if (!user) throw new Error("User not found");

    const parNumFilter = { parNum: user.parent };
    const idLength = String(id).length;

    let idFilter = {};
    if (idLength === 6) {
      idFilter = { citymunCode: id };
    } else if (idLength > 6 && idLength < 10) {
      idFilter = { brgyCode: id };
    } else {
      idFilter = { $or: [{ citymunCode: user.accessCode }, { brgyCode: user.accessCode }] };
    }




    const baseFilter = { ...parNumFilter, ...idFilter };
    const tagFilter = (!tag || tag === "total")
      ? { "tags.value": { $in: ["confirm", "verified", "undecided", "unknown", "sure_voter", "voted"] } }
      : { "tags.value": { $in: allTags } };

    console.log(baseFilter, tagFilter, 'FIL', id)

    const [counts, recentContactsRaw, overviewLogs, barangayContacts] = await Promise.all([
      // Aggregated counts with disk use
      Contact.aggregate([
        { $match: baseFilter },
        {
          $facet: {
            teamReach: [{ $count: "count" }],
            subscriptions: [{ $match: { subscribed: true } }, { $count: "count" }],
            contacts: [{ $match: tagFilter }, { $count: "count" }],
            target: [{ $match: { "tags.value": "confirm" } }, { $count: "count" }]
          }
        }
      ], { allowDiskUse: true }),

      // Recent contacts (last 10)
      Contact.find(baseFilter)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("name phone createdAt updatedAt")
        .lean(),

      // Aggregated monthly tag logs
      AuditLogs.aggregate([
        {
          $match: {
            $or: [{ system: user.parent }, { userId: user._id }],
            action: "Tag Record"
          }
        },
        {
          $project: {
            month: { $month: "$timestamp" }
          }
        },
        {
          $group: {
            _id: "$month",
            count: { $sum: 1 }
          }
        }
      ], { allowDiskUse: true }),

      // Contacts for barangay breakdown
      Contact.aggregate([
        { $match: baseFilter },
        {
          $project: {
            name: 1,
            brgyCode: 1,
            precinct: 1,
            tags: {
              $filter: {
                input: "$tags",
                as: "tag",
                cond: { $eq: ["$$tag.tagType", "tag"] }
              }
            }
          }
        }
      ], { allowDiskUse: true })
    ]);

    // Safe extractors
    const stats = counts[0];
    const safeCount = (key: string) => stats[key]?.[0]?.count || 0;
    const teamReach = safeCount("teamReach");
    const subscriptions = safeCount("subscriptions");
    const contacts = safeCount("contacts");
    const target = safeCount("target");

    // Format recent contacts
    const recentContacts = recentContactsRaw.map(contact => ({
      ...contact,
      _id: contact._id.toString()
    }));

    // Format chart data by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const overviewChartData = months.map((month, index) => {
      const found = overviewLogs.find((log: any) => log._id === index + 1);
      return {
        name: month,
        total: found?.count || 0
      };
    });

    // Format barangay breakdown
    const newBarangay = barangayContacts.map(contact => {
      const barangay = barangays.find(brgy => brgy.brgyCode === contact.brgyCode)?.brgyDesc;
      const tagName = contact.tags.length ? contact.tags.find(a => a.value == tag)?.value ? contact.tags.find(a => a.value == tag).value : contact.tags[0].value : "unknown";
      return { name: contact.name, precinct: contact.precinct, barangay, tags: contact.tags, tag: tagName };
    });

    const groupedBar = newBarangay.reduce((acc: any, contact) => {
      const bar = contact.barangay || "Unknown Barangay";
      if (!acc[bar]) {
        acc[bar] = { total: 0, confirm: 0, declined: 0, undecided: 0, unknown: 0, verified: 0 };
      }
      acc[bar].total += 1;
      contact.tags.forEach(tag => {
        acc[bar][tag.value] = (acc[bar][tag.value] || 0) + 1;
      });
      if (contact.tags.length === 0) {
        acc[bar].unknown += 1;
      }
      return acc;
    }, {});

    return {
      teamReach,
      subscriptions,
      contacts,
      target,
      recentContacts,
      barangay: sanitizeObject(groupedBar),
      overviewChartData
    };
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return {
      teamReach: 0,
      subscriptions: 0,
      contacts: 0,
      target: 0,
      recentContacts: [],
      barangay: {},
      overviewChartData: []
    };
  }
};

