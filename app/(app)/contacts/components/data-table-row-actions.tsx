"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { labels } from "../data/data"
import { contactSchema } from "../data/schema"
import { useState } from "react"
import { EditContactForm } from "@/components/contacts/EditContactForm"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { Bell, BellOff, Clipboard } from "lucide-react";


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const contact = contactSchema.parse(row.original);
   const [open, setOpen] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const router = useRouter(); // ⬅ Initialize useRouter

   const handleDelete = async () => {

    try {
      const response = await axios.delete(`/api/contacts/${contact.phone}`);
      if (response.data) {
        toast.success('Deleted Successfully!')
        router.refresh();

      } else {
        toast.error("Failed to send OTP. Please try again.")
      }
    } catch (error: any) {
    console.log(error.response, 'ERR')
    toast.error( "An error occurred while sending OTP.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };
  
  
  const handleSubscribed = async () => {

    try {
      const response = await axios.post(`/api/contacts/${contact.phone}/${contact.subscribed ? 'unsubscribe' : 'subscribe'}`);
      if (response.data) {
        toast.success('Deleted Successfully!')
        router.refresh();

      } else {
        toast.error("Failed to send OTP. Please try again.")
      }
    } catch (error: any) {
    console.log(error.response, 'ERR')
    toast.error( "An error occurred while sending OTP.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };
   
   
   
   

  return (
  <>
  <EditContactForm
    contact={contact}
    open={open}
    setOpen={setOpen}
  />
   <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This contact will no longer be
              accessible by you or others you&apos;ve shared it with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete()
                setShowDeleteDialog(false)
              
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <DropdownMenuContent align="end" className="w-[180px]">
               
        <DropdownMenuItem
          onClick={() => setOpen(true)}
        >Edit</DropdownMenuItem>

        <DropdownMenuSeparator />
         <DropdownMenuItem
          onClick={() => handleSubscribed()}
         >
          {contact.subscribed ? 'Unsubscribe' : 'Subscribe'}
          <DropdownMenuShortcut>{contact.subscribed ? <BellOff size={18}/> : <Bell size={18}/> } </DropdownMenuShortcut>

        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
               onClick={() => navigator.clipboard.writeText(contact.phone)}
                 >
              Copy 
              <DropdownMenuShortcut><Clipboard size={18}/></DropdownMenuShortcut>

             </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete
          <DropdownMenuShortcut><Trash size={18}/></DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
