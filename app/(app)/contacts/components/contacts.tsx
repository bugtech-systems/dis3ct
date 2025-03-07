'use client'

import { useEffect, useState } from "react";
import { columns } from "./columns"
import CardsDataTable from "./data-table"
import { useContact } from "@/components/providers/ContactProvider";
import { useComponent } from "@/components/providers/ComponentContext";
import { mergeUniqueObjects } from "@/lib/helpers";
import { SendInviteForm } from "@/components/contacts/SendInviteForm";

export default function ContactsPage() {
    const { system, contactTable, setContactTable, user } = useContact()
    const { refreshId, setIsRefreshing, setRefreshId, isRefreshing } = useComponent();
    // const [contacts, setContacts] = useState([]);
    const [limit, setLimit] = useState(10000);
    const [currentSystem, setCurrentSystem] = useState<any>([]);

    const fetchContacts = async (e?: any) => {

        try {
            setIsRefreshing(true)
            const response = await fetch(`/api/contacts?system=${e._id}&userId=${user._id}&limit=${e?.limit ? e.limit : limit}${e ? `&level=${e.accessLevel}&code=${e.accessCode}` : ''}`);
            if (!response.ok) {
                throw new Error("Failed to fetch contacts")
            }
            const resData = await response.json();


            if (resData) {
                let { data, pagination } = resData;
                setContactTable(data)
                setLimit(pagination.total)
                // return
                // setIsRefreshing(false)
                // setRefreshId(null)
            }
            // console.log(limit, pagination, 'LIM')
            // setPageSize(pagination.limit)
            // setPageIndex(pagination.page)
            // setTotalPages(pagination.totalPages)
            // }

            setIsRefreshing(false)
            setRefreshId(null)


            return resData
        } catch (err: any) {
            console.log(err, 'ERROR')
            // setError(err.message || "An unexpected error occurred")
            setRefreshId(null)
            setIsRefreshing(false)
            return null
        }
    }





    // Fetch users on mount & when search/page changes
    // React.useEffect(() => {
    //   if (user && system) {
    //     fetchContacts({ brgyCode: table?.getColumn("brgyCode")?.getFilterValue(), citymunCode: table?.getColumn("citymunCode")?.getFilterValue() });
    //   }
    // }, [debouncedSearch, pageSize, pageIndex, system, user, table?.getColumn("brgyCode")?.getFilterValue(), table?.getColumn("citymunCode")?.getFilterValue()]);


    useEffect(() => {
        const handleInit = async () => {
            await fetchContacts({ ...system, limit: 10000 });
            setIsRefreshing(true)
            setRefreshId(Math.random())


        }

        if (system?._id != currentSystem?._id) {
            setLimit(10000)
            setRefreshId(null)
            setCurrentSystem(system)
            setContactTable([])
            handleInit()
        }

    }, [system])

    useEffect(() => {
        if (currentSystem && refreshId) {
            fetchContacts(system)
        }
    }, [refreshId, currentSystem])


    return (
        <>

            <SendInviteForm />
            <div className="flex-1 space-y-4 p-3">
                {/* <DataTable data={tasks} columns={columns} /> */}

                {/* Search Input */}
                <CardsDataTable
                    data={contactTable}
                    columns={columns}
                />
            </div>
        </>
    )
}
