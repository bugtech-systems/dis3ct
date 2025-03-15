import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { sanitizeObject, sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { Contact } from '@/app/(app)/contacts/data/schema';
import IContact from '@/models/Contact';
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import User from '@/models/User';



function objectToString(obj: any, separator = " ") {
  return Object.values(obj).join(separator);
}


const getHotlines = async (): Promise<Contact[]> => {

  try {


    // const phone = session.user.phone;
    // const userId = session.user.id;

    await connectToDatabase()

    // let contact = await User.findById(userId);
    let contacts = [];
    contacts = await IContact.find({
      // phone: { $ne: sanitizePhoneNumber(phone) },
      // parNum: contact?.parent,
      recordType: 'hotline',
      deletedAt: null
    }).lean() as any;




    let newContacts = []

    newContacts = contacts.map((contact: any) => {
      let barangay = barangays.find((brgy: any) => brgy.brgyCode == contact.brgyCode)?.brgyDesc;
      let citymun = municipalities.find((citymun: any) => citymun.citymunCode == contact.citymunCode)?.citymunDesc;
      let province = provinces.find((province: any) => province.provCode == contact.provCode)?.provDesc;
      let region = regions.find((region: any) => region.regCode == contact.regCode)?.regDesc;
      let hotline = contact.tags.find(tag => tag.tagType == 'hotline');
      return { name: contact.name, phone: contact.phone || hotline.value, designation: hotline.title, description: hotline.note }
    })






    return newContacts
  } catch (err) {
    return []
  }
}

export default getHotlines