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
  name: z.string().optional().nullable(),
  address: z.string().optional(),
  regCode: z.string().optional().nullable(),
  provCode: z.string().optional().nullable(),
  citymunCode: z.string().optional().nullable(),
  brgyCode: z.string().optional().nullable(),
  userLevel: z.string().optional().nullable(),
  activePreset: z.string().optional().nullable(),
  subscribed: z.boolean().optional().nullable()
})


export type Contact = z.infer<typeof contactSchema>
