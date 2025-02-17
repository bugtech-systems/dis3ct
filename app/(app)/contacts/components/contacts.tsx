import { Metadata } from "next"

import { columns } from "./columns"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { CardsDataTable } from "./data-table"
import { Contact } from "../data/schema";

async function authenticate() {
    const session = await getServerSession(authOptions);
    if (!session) return redirect("/login");
    return session;
}



export const metadata: Metadata = {
    title: "Tasks",
    description: "A task and issue tracker build using Tanstack Table.",
}

export default async function ContactsPage({ contacts }: { contacts: Contact[] }) {

    return (
        <>
            <div className="flex-1 space-y-4 p-3">
                {/* <DataTable data={tasks} columns={columns} /> */}
                <CardsDataTable
                    data={contacts.map(contact => ({ id: String(contact._id), precinct: contact.precinct, idNum: contact.idNum, marker: contact.marker,  username: contact.username, phone: contact.phone, name: contact.name, address: contact.address, userLevel: contact.userLevel, subscribed: contact.subscribed, regCode: contact.regCode, provCode: contact.provCode, citymunCode: contact.citymunCode, brgyCode: contact.brgyCode, activePreset: contact.activePreset, barangay: contact.barangay, citymun: contact.citymun, province: contact.province, region: contact.region, parNum: String(contact.parNum), subscription: contact.subscription, keyStr: contact.keyStr }))}
                    columns={columns}
                />
            </div>
        </>
    )
}
