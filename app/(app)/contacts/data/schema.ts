import { subscribe } from "diagnostics_channel"
import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>



export const contactSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().optional(),
  address: z.string().optional(),
  regCode: z.string().optional(),
  provCode: z.string().optional(),
  citymunCode: z.string().optional(),
  brgyCode: z.string().optional(),
  userLevel: z.string().optional(),
  subscribed: z.boolean().optional()
})


export type Contact = z.infer<typeof contactSchema>
