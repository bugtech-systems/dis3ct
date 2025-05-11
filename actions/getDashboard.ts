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
    const user = await User.findById(isSession ? userId : id).lean();
    if (!user) throw new Error("User not found");

    const parNumFilter = { parNum: user.parent };
    const idLength = String(id).length;

    let idFilter = {};
    if (idLength === 6) {
      idFilter = { citymunCode: id };
    } else if (idLength > 6 && idLength < 10) {
      idFilter = { brgyCode: id };
    }

    const baseFilter = { ...parNumFilter, ...idFilter };
    const tagFilter = (!tag || tag === "total")
      ? { "tags.value": { $in: ["confirm", "verified", "undecided", "unknown", "sure_voter", "voted"] } }
      : { "tags.value": { $in: allTags } };

    // ----------- PARALLELIZED QUERIES ------------
    const [counts, recentContactsRaw, overviewLogs, barangayContacts] = await Promise.all([
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
      ]),
      Contact.find(baseFilter)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("name phone createdAt updatedAt")
        .lean(),
      AuditLogs.find({
        $or: [{ system: user.parent }, { userId: user._id }],
        action: "Tag Record"
      }).sort({ timestamp: 1 }).select("timestamp").lean(),
      Contact.find(baseFilter).select("name brgyCode tags precinct").lean()
    ]);

    // ------- Extract counts safely -------
    const safeCount = (arr: any, key: string) => (arr[0]?.[key]?.[0]?.count || 0);
    const stats = counts[0];
    const teamReach = stats.teamReach[0]?.count || 0;
    const subscriptions = stats.subscriptions[0]?.count || 0;
    const contacts = stats.contacts[0]?.count || 0;
    const target = stats.target[0]?.count || 0;

    // ------- Recent Contacts -------
    const recentContacts = recentContactsRaw.map(contact => ({
      ...contact,
      _id: contact._id.toString()
    }));

    // ------- Chart Data -------
    const groupedContacts = overviewLogs.reduce((acc: any, log) => {
      const month = new Date(log.timestamp).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const overviewChartData = months.map(month => ({
      name: month,
      total: groupedContacts[month] || 0
    }));

    // ------- Barangay Breakdown -------
    const newBarangay = barangayContacts.map(contact => {
      const barangay = barangays.find(brgy => brgy.brgyCode === contact.brgyCode)?.brgyDesc;
      const tags = contact.tags.filter(a => a.tagType === "tag");
      const tag = tags.length ? tags[0].value : "unknown";
      return { name: contact.name, precinct: contact.precinct, barangay, tags, tag };
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
