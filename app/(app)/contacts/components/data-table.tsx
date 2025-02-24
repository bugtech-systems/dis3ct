"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { ScannerForm } from "@/components/scanner";
import { useDebounce } from "@/hooks/useDebounce";
import { useContact } from "@/components/providers/ContactProvider";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: any;
}

export default function CardsDataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  // const [data, setData] = React.useState<TData[]>([]);
  const [contacts, setContacts] = React.useState([]);
  const { user, system } = useContact()
  const [loading, setLoading] = React.useState<boolean>(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowSelection, setRowSelection] = React.useState({});
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
      // keyStr: false
    })
  const debouncedSearch = useDebounce(search, 500); // Delay search requests

  const handleRowSelection = (e: any) => {
    console.log(e, 'ROW SELECT')
    setRowSelection(e)

  }


  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelection,
    enableRowSelection: true, // This must be true to allow selection
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex, pageSize },
      rowSelection, // Ensure the state includes rowSelection
    },
  });


  // Fetch Data with Pagination
  const fetchContacts = async (e: any) => {
    console.log(e, 'FETCH CONTACT')
    try {
      const response = await fetch(`/api/contacts?search=${debouncedSearch}${e.brgyCode ? `&brgyCode=${e.brgyCode}` : ''}${e.citymunCode ? `&brgyCode=${e.citymunCode}` : ''}&page=${pageIndex}&limit=${pageSize}&system=${system?.id}&userId=${user?._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch contacts")
      }
      const resData = await response.json();


      if (resData) {
        let { data, pagination } = resData;
        console.log(data, 'RSS', resData)
        setContacts(data)
        setPageSize(pagination.limit)
        setPageIndex(pagination.page)
        setTotalPages(pagination.totalPages)
      }
    } catch (err: any) {
      console.log(err, 'ERROR')
      // setError(err.message || "An unexpected error occurred")
    } finally {
      // setLoading(false)
    }
  }





  // Fetch users on mount & when search/page changes
  React.useEffect(() => {
    if (user && system) {
      fetchContacts({ brgyCode: table?.getColumn("brgyCode")?.getFilterValue(), citymunCode: table?.getColumn("citymunCode")?.getFilterValue() });
    }
  }, [debouncedSearch, pageSize, pageIndex, system, user, table?.getColumn("brgyCode")?.getFilterValue(), table?.getColumn("citymunCode")?.getFilterValue()]);






  console.log(contacts, 'DATA', pageIndex)
  return (
    <>
      {/* <CreateSystemForm
            open={open}
            setOpen={setOpen}
            contact={contact}
          />
          : contact?.userLevel == 'normal' ?
            <EditContactForm
              open={open}
              setOpen={setOpen}
              contact={contact}
            /> :
            <CreateLeaderFormDialog
              open={open}
              setOpen={setOpen}
              contact={contact}
            /> */}
      <div className="space-y-4">

        <DataTableToolbar search={search} setSearch={setSearch} selectedRow={rowSelection} table={table} />
        <ScannerForm />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow key={index}>
                    {row?.getVisibleCells().map((cell: any) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination
          table={table}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalPages={totalPages}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
        />
      </div >
    </>

  );
}
