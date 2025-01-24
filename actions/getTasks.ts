import connectToDatabase from '@/lib/mongodb';
import Tasks, { ITask } from '@/models/Task';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const getTasks = async (): Promise<ITask[]> => {
 
 try{
     const session = await getServerSession(authOptions) as any;
     if (!session || !session.user) {
       return [];
     }
 
  await connectToDatabase();
  
  
  let tasks = await Tasks.find({})

  


  return tasks
 } catch(err){
  return []
 } 
}

export default getTasks