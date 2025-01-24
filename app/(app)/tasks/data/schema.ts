import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  taskId: z.string().nullable(),
  status: z.string().nullable(),
  label: z.string().nullable(),
  priority: z.string().nullable(),
  taskObject: z.string().nullable()
  
})

export type Task = z.infer<typeof taskSchema>
