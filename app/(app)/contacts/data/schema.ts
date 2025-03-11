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
  _id: z.string().optional(),
  id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  regCode: z.string().optional().nullable(),
  provCode: z.string().optional().nullable(),
  citymunCode: z.string().optional().nullable(),
  brgyCode: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  citymun: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  userLevel: z.string().optional().nullable(),
  activePreset: z.string().optional().nullable(),
  subscribed: z.boolean().optional().nullable(),
  parNum: z.string().optional().nullable(),
  subscription: z.string().optional().nullable(),
  tag: z.string().optional().nullable(),
  precinct: z.string().optional().nullable(),
  marker: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  idNum: z.number().optional().nullable(),
  biometric: z.string().optional().nullable(),
  recordType: z.string().optional().nullable(),
  keyStr: z.string().optional().nullable()

})


export type Contact = z.infer<typeof contactSchema>
