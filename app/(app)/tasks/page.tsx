import { Metadata } from "next"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import getTasks from "@/actions/getTasks"
import { priorities } from "./data/data"

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
}


export default async function TaskPage() {
  const tasks = await getTasks()



console.log(tasks, 'TASKS')
  return (
    <>
      <div className="h-full w-full flex-col md:flex">
      <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
          <div className="flex items-center space-x-2">
          <Button>
                          <PlusCircle />
                          Add music
                        </Button>
          </div>
        </div>
     
      <DataTable data={tasks.map(task => ({tile: task.title, category: task.category, status: task.status, priority: task.priority,  _id: String(task._id)}))} columns={columns} />
      </div>
    </>
  )
}
