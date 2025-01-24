'use client';


import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { labels } from "../data/data"
import { taskSchema } from "../data/schema"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { CodeViewer } from "./code-viewer";
import { useState } from "react";



interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original);
  const router = useRouter(); // ⬅ Initialize useRouter
  const [open, setOpen] = useState(false);
  const handleUpdateTask = async (id: any) => {
console.log(task, 'TASK', id, )
      try {
        const response = await axios.post(`/api/tasks/${id}/reprocess?status=Todo`);
        if (response.data) {
          toast.success('Deleted Successfully!')
          router.refresh();
  
        } else {
          toast.error( "An error occurred while Retriggering.")
        }
      } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error( "An error occurred .")
        // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
      }
  }
  
  
  
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
    toast.error( "An error occurred while deleting.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };
  
  
  
console.log(task, 'TASKS')
  return (
  <>
  <CodeViewer
      open={open}
      setOpen={setOpen}
      row={task}
  />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => handleUpdateTask(task.id)}>Retrigger</DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setOpen(true)}>View Details</DropdownMenuItem>
        {/* <DropdownMenuItem>Favorite</DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label || ""}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleDelete(task.id)}
        >
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
    
  )
}
