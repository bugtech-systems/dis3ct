'use client'

import { useEffect, useState } from "react";
import { columns } from "./columns"
import { CardsDataTable } from "./data-table"
import { useContact } from "@/components/providers/ContactProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactsPage() {
    const { user, system } = useContact()
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(100)
    const debouncedSearch = useDebounce(search, 500); // Delay search requests



    const fetchContacts = async () => {
        try {
            const response = await fetch(`/api/contacts?search=${debouncedSearch}&page=${page}&limit=${limit}&business=${system}`);
            if (!response.ok) {
                throw new Error("Failed to fetch presets")
            }
            const resData = await response.json();


            if (resData) {
                let { data } = resData;
                console.log(data)
                setContacts(data)
            }
        } catch (err: any) {
            console.log(err, 'ERROR')
            // setError(err.message || "An unexpected error occurred")
        } finally {
            // setLoading(false)
        }
    }

    // Fetch presets from the API
    // useEffect(() => {
    //     if (user) {
    //         fetchContacts()
    //     }
    // }, [user])



    // Fetch users on mount & when search/page changes
    useEffect(() => {
        fetchContacts();
    }, [debouncedSearch, page, system]);







    console.log(contacts, user, system, 'CONTACTS')
    return (
        <>
            <div className="flex-1 space-y-4 p-3">
                {/* <DataTable data={tasks} columns={columns} /> */}

                {/* Search Input */}
                <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <CardsDataTable
                    data={contacts}
                    columns={columns}
                />
            </div>
        </>
    )
}
