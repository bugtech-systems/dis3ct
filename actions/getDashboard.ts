import connectToDatabase from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';
import { getServerSession } from "next-auth";
// import { sanitizePhoneNumber } from "@/lib/helpers";
import { authOptions } from "@/lib/authOptions";


const getLeaderDashboard = async (parent?: any): Promise<any | null> => {
  let teamReach = 0;
  let subscriptions = 0;
  let contacts = 0;
  let recentContacts = [] as any;
  let overviewChartData = [] as any;


  try {





    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return { teamReach, subscriptions, contacts, recentContacts, overviewChartData };
    }

    const userId = session.user.id;

    await connectToDatabase()
    let options = {
      deletedAt: null,
      parNum: null
    } as any;

    const user = await Contact.findById(userId || parent);
    if (user) {
      options.parNum = userId ? user.parNum : user._id;
    }


    console.log(userId, 'USERID')

    teamReach = await Contact.countDocuments({ ...options });
    subscriptions = await Contact.countDocuments({ subscribed: true, ...options });
    contacts = await Contact.countDocuments({ uplines: { $in: userId }, ...options });


    console.log(teamReach, subscriptions, contacts, 'DSHBOAR', options)

    // Fetch 5 recent contacts
    recentContacts = await Contact.find({ refNum: userId, ...options })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name phone createdAt");

    // Generate Dummy Chart Data
    overviewChartData = [
      { name: "Jan", total: 1500 },
      { name: "Feb", total: 1000 },
      { name: "Mar", total: 2000 },
      { name: "Apr", total: 3500 },
      { name: "May", total: 4000 },
      { name: "Jun", total: 5000 },
      { name: "Jul", total: 2500 },
      { name: "Aug", total: 6000 },
      { name: "Sep", total: 4500 },
      { name: "Oct", total: 3000 },
      { name: "Nov", total: 3200 },
      { name: "Dec", total: 3700 },
    ];




    return { teamReach, subscriptions, contacts, recentContacts, overviewChartData }
  } catch (err) {
    return { teamReach, subscriptions, contacts, recentContacts, overviewChartData }
  }
}

export default getLeaderDashboard