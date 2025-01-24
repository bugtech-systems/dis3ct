import connectToDatabase from '@/lib/mongodb';
import Tasks, { ITask } from '@/models/Task';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const getTasks = async (): Promise<any[]> => {
 
 try{
     const session = await getServerSession(authOptions) as any;
     if (!session || !session.user) {
       return [];
     }
 
  await connectToDatabase();
  
  
  let tasks = await Tasks.find({})
                          .sort({ createdAt: -1 })
                          .lean()

  let newTasks = tasks.map((task: any) => ({id: String(task._id), taskId: task?.taskId, title: task?.title, status: task?.status, category: task.category, label: task.category,  priority: task?.priority, taskObject: task.taskObject }))
  
  console.log(tasks, 'TAASKS');


  return newTasks
 } catch(err){
  return []
 } 
}

export default getTasks