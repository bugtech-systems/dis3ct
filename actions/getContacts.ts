import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { Contact } from '@/app/(app)/contacts/data/schema';
import IContact from '@/models/Contact';

const getLeadersContacts = async (): Promise<Contact[]> => {

  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return [];
    }

    const phone = session.user.phone;
    const userId = session.user.id;

    await connectToDatabase()

    let contact = await IContact.findById(userId);
    let contacts = [];

    if (contact?.userLevel == 'admin') {
      contacts = await IContact.find({
        phone: { $ne: sanitizePhoneNumber(phone) },

        // refNum: userId,
        deletedAt: null
      }).lean();
    } else if (contact?.userLevel == 'system') {
      contacts = await IContact.find({
        phone: { $ne: sanitizePhoneNumber(phone) },
        parNum: contact?.parNum,
        deletedAt: null
      }).lean() as any;

    } else {

      contacts = await IContact.find({
        phone: { $ne: sanitizePhoneNumber(phone) },
        uplines: { $in: [contact?.id] }, // Check if referrer.id is in the uplines array
        parNum: contact?.parNum,
        deletedAt: null
      }).lean() as any;

    }


    return contacts
  } catch (err) {
    return []
  }
}

export default getLeadersContacts