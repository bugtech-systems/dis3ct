import connectToDatabase from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';
import { getServerSession } from "next-auth";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";

const getLeadersContacts = async (): Promise<IContact[]> => {
 
 try{
     const session = await getServerSession(authOptions) as any;
     if (!session || !session.user) {
       return [];
     }
 
     const phone = session.user.phone;
     const userId = session.user.id;

  await connectToDatabase()
  
  
  
  let contacts = await Contact.find({
    phone: { $ne: sanitizePhoneNumber(phone) },
    refNum: userId,
    deletedAt: null
  }).lean();
console.log(contacts, 'LEADERS CONTACTS', phone, userId)
  return contacts
 } catch(err){
  return []
 } 
}

export default getLeadersContacts