'use client'

import { columns } from "./columns"
import CardsDataTable from "./data-table"
import { useComponent } from "@/components/providers/ComponentContext";
import { SendInviteForm } from "@/components/contacts/SendInviteForm";
import { SetHotlineForm } from "@/components/contacts/SetHotlineForm";

export default function ContactsPage() {
    const { modal } = useComponent();
    // const [contacts, setContacts] = useState([]);



    return (
        <>
            {modal == 'setHotline' && <SetHotlineForm />}
            {modal == 'sendInvite' && <SendInviteForm />}
            <div className="flex-1 space-y-4 p-3">
                {/* <DataTable data={tasks} columns={columns} /> */}

                {/* Search Input */}
                <CardsDataTable
                    // data={contactTable}
                    columns={columns}
                />
            </div>
        </>
    )
}
