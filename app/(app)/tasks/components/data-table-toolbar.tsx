"use client"

import { Table } from "@tanstack/react-table"
import { RefreshCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/(app)/tasks/components/data-table-view-options"

import { priorities, statuses } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const isFiltered = table.getState().columnFilters.length > 0



  const handleDelete = async (id: any) => {

    try {
      const response = await axios.delete(`/api/tasks?id=${id}`);
      if (response.data) {
        toast.success('Deleted Successfully!')
        router.refresh();

      } else {
        toast.error("Failed to delete, Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while deleting.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };




  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )}


        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <Button
        // variant="ghost"
        onClick={() => router.refresh()}
        className="h-8 mx-3 px-2 lg:px-3"
      >
        <RefreshCcw />
      </Button>
      <DataTableViewOptions table={table} />
    </div>
  )
}
