import { Metadata } from "next"
import Image from "next/image"
import { z } from "zod"

import { columns } from "./components/columns"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { CardsDataTable } from "./components/data-table"
import getLeadersContacts from "@/actions/getContacts"

async function authenticate() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/login");
  return session;
}



export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
}

export default async function TaskPage() {
  await authenticate();

  const contacts = await getLeadersContacts();

  return (
    <>

<div className="flex-1 space-y-4 p-3">

{/* <DataTable data={tasks} columns={columns} /> */}
<CardsDataTable 
  data={contacts.map(contact => ({id: String(contact._id), phone: contact.phone, name: contact.name, address: contact.address, userLevel: contact.userLevel,  subscribed: contact.subscribed, regCode: contact.regCode, provCode: contact.provCode, citymunCode: contact.citymunCode, brgyCode: contact.brgyCode}))}
  columns={columns}  
/>
  </div>
    </>
  )
}
