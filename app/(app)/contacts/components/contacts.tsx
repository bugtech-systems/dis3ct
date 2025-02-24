'use client'

import { useEffect, useState } from "react";
import { columns } from "./columns"
import CardsDataTable from "./data-table"
import { useContact } from "@/components/providers/ContactProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);







    // console.log(contacts, user, system, 'CONTACTS')
    return (
        <>
            <div className="flex-1 space-y-4 p-3">
                {/* <DataTable data={tasks} columns={columns} /> */}

                {/* Search Input */}

                <CardsDataTable
                    data={contacts}
                    columns={columns}
                />
            </div>
        </>
    )
}
