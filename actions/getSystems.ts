import connectToDatabase from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sanitizePhoneNumber } from '@/lib/helpers';

const getSystems = async (user: any): Promise<any[]> => {

  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return [];
    }
    const userId = session.user.id;
    const phone = session.user.phone;


    await connectToDatabase();
    let contact = await Contact.findById(user ?? userId)



    let systems = []
    if (contact?.userLevel != 'admin') {

      const users = await Contact.find({
        $and: [{ phone: sanitizePhoneNumber(phone) }, { userLevel: { $ne: 'normal' } }]
      }).populate('parNum').lean();


      let systemObject = {} as any;

      users.forEach(user => {
        if (user?.parNum?._id) {
          systemObject[String(user.parNum._id)] = { ...user.parNum, userId: user.id }
        }
      })


      systems = Object.keys(systemObject).map(system => { return systemObject[system] });
    } else {

      systems = await Contact.find({
        $and: [{ deletedAt: null }, { userLevel: 'system' }]
      });

    }

    return systems
  } catch (err) {
    return []
  }
}

export default getSystems