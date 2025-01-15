import connectToDatabase from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const getSystems = async (): Promise<IContact[]> => {
 
 try{
     const session = await getServerSession(authOptions) as any;
     if (!session || !session.user) {
       return [];
     }
 
  await connectToDatabase();
  
  
  let systems = await Contact.find({
    userLevel: 'system',
    deletedAt: null
  }).lean();

  


  return systems
 } catch(err){
  return []
 } 
}

export default getSystems