'use client'

import { useEffect, useState } from "react";
import { columns } from "./columns"
import CardsDataTable from "./data-table"
import { useContact } from "@/components/providers/ContactProvider";
import { useComponent } from "@/components/providers/ComponentContext";
import { mergeUniqueObjects } from "@/lib/helpers";
import { SendInviteForm } from "@/components/contacts/SendInviteForm";

export default function ContactsPage() {
    const { system, contactTable, setContactTable, user, parentSystem } = useContact()
    const { refreshId, setIsRefreshing, setRefreshId, modal } = useComponent();
    // const [contacts, setContacts] = useState([]);
    const [limit, setLimit] = useState(10000);
    const [currentSystem, setCurrentSystem] = useState<any>([]);

    const fetchContacts = async (e?: any) => {

        try {
            setIsRefreshing(true)
            if (!e?._id) {
                setRefreshId(null)
                setIsRefreshing(false)
                return
            }

            const response = await fetch(`/api/contacts?userId=${e._id}&limit=${e?.limit ? e.limit : e?.accessCodes ? limit : 0}${e ? `&level=${e.accessLevel}&code=${e.accessCode}` : ''}${e?.accessCodes?.length ? `&brgyCode=${e?.accessCodes}` : `&brgyCode=${[e?.accessCode]}`}`);
            if (!response.ok) {
                throw new Error("Failed to fetch contacts")
            }
            const resData = await response.json();


            if (resData) {
                let { data, pagination } = resData;
                setContactTable(data)
                if (pagination.total) {
                    setLimit(pagination.total)
                }
                // setIsRefreshing(false)
                // setRefreshId(null)
                // return 
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
            await fetchContacts({ ...parentSystem, limit: 1000 });
            if (user.userType != 'admin') {
                setIsRefreshing(true)
                setRefreshId(Math.random())
            }

        }

        if (parentSystem?._id != currentSystem?._id) {
            setLimit(1000)
            setRefreshId(null)
            setCurrentSystem(parentSystem)
            setContactTable([])
            handleInit()
        }

    }, [parentSystem])

    useEffect(() => {
        if (currentSystem && refreshId) {
            fetchContacts(parentSystem)
        }
    }, [refreshId])


    return (
        <>

            {modal == 'sendInvite' && <SendInviteForm />}
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
