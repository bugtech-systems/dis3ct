import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { Contact } from '@/app/(app)/contacts/data/schema';
import IContact from '@/models/Contact';
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";



function objectToString(obj: any, separator = " ") {
  return Object.values(obj).join(separator);
}


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
        // phone: { $ne: sanitizePhoneNumber(phone) },

        // refNum: userId,
        // deletedAt: null
      }).lean();
    } else if (contact?.userLevel == 'system') {
      contacts = await IContact.find({
        // phone: { $ne: sanitizePhoneNumber(phone) },
        parNum: contact?.parNum,
        // deletedAt: null
      }).lean() as any;

    } else {

      contacts = await IContact.find({
        // phone: { $ne: sanitizePhoneNumber(phone) },
        $or: [{ uplines: { $in: [String(contact?._id)] } }, { refNum: contact?._id }],
        parNum: contact?.parNum,
        // deletedAt: null
      }).lean() as any;
    }




    let newContacts = []

    newContacts = contacts.map((contact: any) => {
      let barangay = barangays.find((brgy: any) => brgy.brgyCode == contact.brgyCode)?.brgyDesc;
      let citymun = municipalities.find((citymun: any) => citymun.citymunCode == contact.citymunCode)?.citymunDesc;
      let province = provinces.find((province: any) => province.provCode == contact.provCode)?.provDesc;
      let region = regions.find((region: any) => region.regCode == contact.regCode)?.regDesc;
      let keyStr = objectToString({ ...contact, barangay, citymun, province, region })
      return { ...contact, barangay, citymun, province, region, keyStr }
    })






    return newContacts
  } catch (err) {
    return []
  }
}

export default getLeadersContacts