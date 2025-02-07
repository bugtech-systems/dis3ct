import connectToDatabase from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';
import { getServerSession } from "next-auth";
// import { sanitizePhoneNumber } from "@/lib/helpers";
import { authOptions } from "@/lib/authOptions";


const getLeaderDashboard = async (userId?: any): Promise<any | null> => {
  let teamReach = 0;
  let subscriptions = 0;
  let contacts = 0;
  let recentContacts = [] as any;
  let overviewChartData = [] as any;
  let newChartData = [] as any;


  try {





    // const session = await getServerSession(authOptions) as any;
    // if (!session || !session.user) {
    //   return { teamReach, subscriptions, contacts, recentContacts, overviewChartData };
    // }

    // const userId = session.user.id;

    await connectToDatabase()
    let options = {
      deletedAt: null
    } as any;

    const user = await Contact.findById(userId);
    if (user?.userLevel != 'admin') {
      options.parNum = user?._id ? user?.parNum : user?._id;
    }

    console.log(user?._id, 'REF ID', userId, options)

    teamReach = await Contact.countDocuments({ ...options });
    subscriptions = await Contact.countDocuments({ subscribed: true, ...options });
    contacts = await Contact.countDocuments({ uplines: { $in: user?._id }, ...options });


    let overview = await Contact.find({ ...options })
      .sort({ createdAt: 1 }) // Sort in ascending order
      .select("name phone createdAt");


    if (user?.userLevel != 'admin') {
      options.uplines = { $in: [String(user?._id)] }// Check if referrer.id is in the uplines array
    }

    // Fetch 5 recent contacts
    recentContacts = await Contact.find({ ...options })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name phone createdAt");



    const groupedContacts = overview.reduce((acc: any, contact) => {
      const month = new Date(contact.createdAt).toLocaleString("default", { month: "short" });

      if (!acc[month]) {
        acc[month] = [];
      }

      acc[month].push(contact);
      return acc;
    }, {});


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

    console.log(groupedContacts, 'GROUPED')


    overviewChartData.forEach((row: any) => {
      console.log(row, 'ROW')
      newChartData.push({
        name: row.name, total: groupedContacts[row.name] ? groupedContacts[row.name].length : 0
      })

    })

    return { teamReach, subscriptions, contacts, recentContacts, overviewChartData: newChartData }
  } catch (err) {
    console.log(err, "ERROR")
    return { teamReach, subscriptions, contacts, recentContacts, overviewChartData: newChartData }
  }
}

export default getLeaderDashboard