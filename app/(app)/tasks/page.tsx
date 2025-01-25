import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import { z } from "zod"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { taskSchema } from "./data/schema"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import getTasks from "@/actions/getTasks"

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
}

// Simulate a database read for tasks.
// async function getTasks() {
//   const data = await fs.readFile(
//     path.join(process.cwd(), "app/(app)/tasks/data/tasks.json")
//   )

//   const tasks = JSON.parse(data.toString())

//   return z.array(taskSchema).parse(tasks)
// }

export default async function TaskPage() {
  const tasks = await getTasks()
  return (
    <>
        <div className="flex-1 space-y-4 p-8 pt-3">
      <DataTable data={tasks} columns={columns} />
      </div>

    </>
  )
}
