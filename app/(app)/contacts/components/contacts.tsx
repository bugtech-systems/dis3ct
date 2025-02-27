'use client'

import { useEffect, useState } from "react";
import { columns } from "./columns"
import CardsDataTable from "./data-table"
import { useContact } from "@/components/providers/ContactProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactsPage() {
    const { system } = useContact()
    const [contacts, setContacts] = useState([]);


    const fetchContacts = async (e?: any) => {
        try {
            const response = await fetch(`/api/contacts?system=${e._id}&${e ? `level=${e.accessLevel}&code=${e.accessCode}` : ''}`);
            if (!response.ok) {
                throw new Error("Failed to fetch contacts")
            }
            const resData = await response.json();


            if (resData) {
                let { data, pagination } = resData;
                setContacts(data)
                // setPageSize(pagination.limit)
                // setPageIndex(pagination.page)
                // setTotalPages(pagination.totalPages)
            }
        } catch (err: any) {
            console.log(err, 'ERROR')
            // setError(err.message || "An unexpected error occurred")
        } finally {
            // setLoading(false)
        }
    }





    // Fetch users on mount & when search/page changes
    // React.useEffect(() => {
    //   if (user && system) {
    //     fetchContacts({ brgyCode: table?.getColumn("brgyCode")?.getFilterValue(), citymunCode: table?.getColumn("citymunCode")?.getFilterValue() });
    //   }
    // }, [debouncedSearch, pageSize, pageIndex, system, user, table?.getColumn("brgyCode")?.getFilterValue(), table?.getColumn("citymunCode")?.getFilterValue()]);


    useEffect(() => {
        if (system) {
            fetchContacts(system)
        }

    }, [system])




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
