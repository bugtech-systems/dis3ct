"use server";

import { sanitizeObject } from "@/lib/helpers";
import connectToDatabase from "@/lib/mongodb";
import AuditLogs from "@/models/AuditLogs";
import Contact from "@/models/Contact";
import User from "@/models/User";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const getLeaderDashboard = async (id): Promise<any> => {
  try {
    // Get session & user details
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return [];
    }
    const userId = session.user.id;


    await connectToDatabase();
    let user = await User.findById(userId)


    // // Get user details
    // const user = await User.findById(id).lean(); // ✅ Convert to plain object
    if (!user) {
      throw new Error("User not found");
    }

    // let brgyCode = user.accessCodes;

    // let brgys = brgyCode ? brgyCode.map(brgy => {
    //   return {
    //     brgyCode: brgy, parNum: user.parent
    //   }
    // }) : []



    // let options: any = { deletedAt: null };
    // if (user.userType != "leader") {
    //   options.parNum = user.parent;

    // } else if (user.userType == 'leader') {
    //   options.parNum = user.parent;
    //   // options[user.accessLevel] = user.accessCode;
    //   if (brgys.length) {
    //     options.$or = brgys;
    //   }
    // }
    let isSystem = String(id).length == 6
    let options = isSystem ? { citymunCode: id } : { brgyCode: id }



    // Aggregate Dashboard Data
    const [teamReach, subscriptions, contacts, recentContacts] = await Promise.all([
      Contact.countDocuments({ ...options }),
      Contact.countDocuments({ subscribed: true, ...options }),
      Contact.countDocuments({
        ...options,
        'tags.tagType': { $in: ['tag', 'image', 'biometrics'] },
      }),
      // Contact.countDocuments({ uplines: { $in: user._id?.toString() }, ...options }),
      Contact.find({ ...options })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("name phone createdAt updatedAt")
        .lean(), // ✅ Convert to plain objects
    ]);

    // Generate Chart Data
    const overview = await AuditLogs.find({ $or: [{ system: user.parent }, { userId: user }], action: 'Tag Record' }).sort({ timestamp: 1 }).select("timestamp").lean(); // ✅ Use .lean()
    const barangay = await Contact.find(options).select("name brgyCode tags").lean(); // ✅ Use .lean()

    let newBarangay = barangay.map((contact: any) => {
      let barangay = barangays.find((brgy: any) => brgy.brgyCode == contact.brgyCode)?.brgyDesc;
      let tags = contact.tags.filter(a => a.tagType == 'tag');

      let tag = tags.length ? tags[0].value : 'unknown';

      return { name: contact.name, barangay, tags, tag }
    })


    let groupedBar = newBarangay.reduce((acc: any, contact) => {
      const bar = contact.barangay;
      if (acc[bar]) {
        acc[bar] = { ...acc[bar], total: acc[bar].total + 1, [contact.tag]: (acc[bar][contact.tag] || 0) + 1 };
      } else {
        acc[bar] = { total: 0, confirm: 0, declined: 0, undecided: 0, unknown: 0 };
      }
      return acc;
    }, {})



    const groupedContacts = overview.reduce((acc: any, contact) => {
      const month = new Date(contact.timestamp).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const overviewChartData = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ].map((month) => ({
      name: month,
      total: groupedContacts[month] || 0,
    }));

    let newContacts = [];

    recentContacts.forEach((contact) => {
      newContacts.push({ ...contact, _id: contact._id.toString() })
    })



    return { teamReach, subscriptions, contacts, recentContacts: newContacts, overviewChartData, barangay: sanitizeObject(groupedBar) }
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return { teamReach: 0, subscriptions: 0, contacts: 0, recentContacts: [], overviewChartData: [] };
  }
};
