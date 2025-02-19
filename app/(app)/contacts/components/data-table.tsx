"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { regions } from "@/lib/locationData"
import { useContact } from "@/components/providers/ContactProvider"
// import { DataTableToolbar } from "./data-table-toolbar"


/* const data: Contact[] = [
  {
    id: "m5gr84i9",
    phone: "094461641316",
    status: "success",
    name: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    phone: "094461641242",
    status: "success",
    name: "Abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    phone: "094461641837",
    status: "processing",
    name: "Monserrat44@gmail.com",
  },
  {
    id: "bhqecj4p",
    phone: "094461641721",
    status: "failed",
    name: "carmella@hotmail.com",
  },
] */

// export type Contact = {
//   id: string
//   phone: string
//   status: "pending" | "processing" | "success" | "failed"
//   name: string
// }

// export const columns: ColumnDef<Contact>[] = [
//   {
//     id: "select",
//     header: ({ table }) => (
//       <Checkbox
//         checked={
//           table.getIsAllPageRowsSelected() ||
//           (table.getIsSomePageRowsSelected() && "indeterminate")
//         }
//         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//         aria-label="Select all"
//       />
//     ),
//     cell: ({ row }) => (
//       <Checkbox
//         checked={row.getIsSelected()}
//         onCheckedChange={(value) => row.toggleSelected(!!value)}
//         aria-label="Select row"
//       />
//     ),
//     enableSorting: false,
//     enableHiding: false,
//   },
//   {
//     accessorKey: "phone",
//     header: () => <div className="text-left">Mobile #</div>,
//     cell: ({ row }) => {
//       const phone = row.getValue("phone")

//       // Format the amount as a dollar amount
//       return <div className="text-left font-medium">{sanitizePhoneNumber(phone)}</div>
//     },
//   },
//   {
//     accessorKey: "name",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//           className="text-left"
//         >
//           Name
//           <ArrowUpDown />
//         </Button>
//       )
//     },
//     cell: ({ row }) => <div className="text-left lowercase">{row.getValue("name")}</div>,
//   },
//   {
//     accessorKey: "status",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//           className="text-left"
//         >
//           Status
//           <ArrowUpDown />
//         </Button>
//       )
//     },
//     cell: ({ row }) => (
//       <div className="capitalize text-left">{row.getValue("status")}</div>
//     ),
//   },
//   {
//     id: "actions",
//     enableHiding: false,
//     cell: ({ row }) => {
//       const payment = row.original

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">View Contact</span>
//               <MoreHorizontal />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//             <DropdownMenuItem
//               onClick={() => navigator.clipboard.writeText(payment.phone)}
//             >
//               Copy Contact Number
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>View customer</DropdownMenuItem>
//             <DropdownMenuItem>View payment details</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       )
//     },
//   },
// ]
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: any[]
}

export function CardsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { system } = useContact()
  const [sorting, setSorting] = React.useState<SortingState>([])
  // const [contacts, setContacts] = React.useState<TData[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      phone: false,
      province: false,
      citymun: false,
      barangay: false,
      address: true, // Hide address column by default.
      userLevel: false,
      regCode: false,
      region: false,
      provCode: false,
      citymunCode: false,
      brgyCode: false,
      activePreset: false,
      keyStr: false
    })
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data: data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    // setContacts([])
    console.log(data, 'DTA', system?.id)
    // if (system?.id) {
    //   let newData = data.filter(row => { return row?.parNum == system.id })
    //   setContacts(newData)
    // } else {
    //   setContacts(data)
    // }

  }, [data, system])



  console.log(table, 'table', table.getState().pagination.pageIndex + 1)

  return (

    <div className="space-y-4">
      {/* <DataTableToolbar selectedRow={rowSelection} table={table} /> */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="[&:has([role=checkbox])]:pl-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="[&:has([role=checkbox])]:pl-3"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* <DataTablePagination table={table} /> */}

      {/*   <div className="flex items-center justify-end space-x-2 pt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            > 
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div> */}
    </div>

  )
}
