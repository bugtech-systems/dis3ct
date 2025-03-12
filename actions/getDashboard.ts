"use server";

import connectToDatabase from "@/lib/mongodb";
import AuditLogs from "@/models/AuditLogs";
import Contact from "@/models/Contact";
import User from "@/models/User";

export const getLeaderDashboard = async (id): Promise<any> => {
  try {
    // Get session & user details

    await connectToDatabase();

    // Get user details
    const user = await User.findById(id).lean(); // ✅ Convert to plain object
    if (!user) {
      throw new Error("User not found");
    }

    let brgyCode = user.accessCodes;

    let brgys = brgyCode ? brgyCode.map(brgy => {
      return { brgyCode: { $regex: brgy, $options: "i" }, parNum: user.parent }
    }) : []



    let options: any = { deletedAt: null };
    if (user.userType == "system") {
      options.parNum = user.parent;
    } else if (user.userType == 'leader') {
      options.parNum = user.parent;
      // options[user.accessLevel] = user.accessCode;
    }


    if (brgys.length) {
      options.$or = brgys;
    }


    // Aggregate Dashboard Data
    const [teamReach, subscriptions, contacts, recentContacts] = await Promise.all([
      Contact.countDocuments({ ...options }),
      Contact.countDocuments({ subscribed: true, ...options }),
      Contact.countDocuments({
        'tags.user': id,
      }),
      // Contact.countDocuments({ uplines: { $in: user._id?.toString() }, ...options }),
      Contact.find({ ...options })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("name phone createdAt updatedAt")
        .lean(), // ✅ Convert to plain objects
    ]);



    // Generate Chart Data
    const overview = await AuditLogs.find({ $or: [{ system: user.parent }, { userId: user }], action: 'Tag Record' }).sort({ timestamp: 1 }).select("timestamp").lean(); // ✅ Use .lean()

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



    return { teamReach, subscriptions, contacts, recentContacts: newContacts, overviewChartData }
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return { teamReach: 0, subscriptions: 0, contacts: 0, recentContacts: [], overviewChartData: [] };
  }
};
