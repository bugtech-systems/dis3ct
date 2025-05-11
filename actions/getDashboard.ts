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

    const user = (String(id).length < 10 || session)
      ? await User.findById(userId).lean()
      : await User.findById(id).lean();

    if (!user) throw new Error("User not found");

    const parNumFilter = { parNum: user.parent };
    const idLength = String(id).length;

    let idFilter = {};
    if (idLength === 6) {
      idFilter = { citymunCode: id };
    } else if (idLength > 6 && idLength < 10) {
      idFilter = { brgyCode: id };
    }

    const combinedFilter = { ...parNumFilter, ...idFilter };

    const tagOptions = (!tag || tag === "total")
      ? { "tags.value": { $in: ["confirm", "verified", "undecided", "unknown", "sure_voter", "voted"] } }
      : { "tags.value": { $in: allTags } };

    // Dashboard stats
    const [teamReach, subscriptions, contacts, target] = await Promise.all([
      Contact.countDocuments(combinedFilter),
      Contact.countDocuments({ ...combinedFilter, subscribed: true }),
      Contact.countDocuments({ ...combinedFilter, ...tagOptions }),
      Contact.countDocuments({ ...combinedFilter, "tags.value": "confirm" })
    ]);

    // Recent contacts (filtered, sorted by updatedAt DESC)
    const recentContactsRaw = await Contact.find(combinedFilter)
      .sort({ updatedAt: -1 }) // Strictly updatedAt DESC
      .limit(10)
      .select("name phone createdAt updatedAt")
      .lean();

    const recentContacts = recentContactsRaw.map(contact => ({
      ...contact,
      _id: contact._id.toString()
    }));

    // Chart Data
    const overviewLogs = await AuditLogs.find({
      $or: [{ system: user.parent }, { userId: user._id }],
      action: "Tag Record"
    }).sort({ timestamp: 1 }).select("timestamp").lean();

    const groupedContacts = overviewLogs.reduce((acc: any, log) => {
      const month = new Date(log.timestamp).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const overviewChartData = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      .map(month => ({ name: month, total: groupedContacts[month] || 0 }));

    // Barangay Breakdown
    const barangayContacts = await Contact.find(combinedFilter).select("name brgyCode tags precinct").lean();

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
