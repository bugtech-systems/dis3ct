"use client"

import { Row } from "@tanstack/react-table"
import { ListRestartIcon, MessageSquarePlusIcon, MoreHorizontal, Trash, UserCheck2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

import { useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { Bell, BellOff, Clipboard } from "lucide-react";
import { useContact } from "@/components/providers/ContactProvider"
import { CreateNewMessageForm } from "@/components/contacts/CreateNewMessageForm"
import { AreaLocationForm } from "@/components/contacts/AreaLocationForm"
import { findFeature } from "@/lib/helpers"

let tagsLabel = [{ label: 'Confirmed', value: 'confirm' }, { label: 'Undecided', value: 'undecided' }, { label: 'Declined', value: 'declined' }];


export function DataTableToolbarActions<TData>({ rows = [], table }: { table: any; rows: any }) {
  // const contact = contactSchema.parse(row.original);
  const { user, parentSystem } = useContact()
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter(); // ⬅ Initialize useRouter

  const handleDelete = async () => {

    try {
      const response = await axios.post(`/api/contacts/bulk/delete`, { rows });
      if (response.data) {
        toast.success('Deleted Successfully!')
        router.refresh();

      } else {
        toast.error("Failed to send OTP. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while sending OTP.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };


  const handleSubscribed = async () => {

    try {
      const response = await axios.post(`/api/contacts/bulk/subscribe`, { rows });
      if (response.data) {
        toast.success(`Subscribed Successfully!`)
        router.refresh();

      } else {
        toast.error("Failed to subscribe. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while Subscribing.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };


  const handleUnsubscribed = async () => {

    try {
      const response = await axios.post(`/api/contacts/bulk/unsubscribe`, { rows });
      if (response.data) {
        toast.success(`Unsubscribed Successfully!`)
        router.refresh();

      } else {
        toast.error("Failed to unsubscribe. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while subscribing.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };



  const handleTag = async (type) => {

    try {
      const response = await axios.post(`/api/contacts/bulk/tag`, { type, system: user._id, contactIds: rows.map(a => { return a._id }) });
      if (response.data) {
        toast.success('Tagged Successfully!')
        router.refresh();
        table.toggleAllPageRowsSelected(false)


      } else {
        toast.error("Failed. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };




  return (
    <>
      <CreateNewMessageForm showContactDialog={showContactDialog} setShowContactDialog={setShowContactDialog} selectedContacts={rows} />
      <AreaLocationForm showContactDialog={showAreaDialog} setShowContactDialog={setShowAreaDialog} selectedContacts={rows} />


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

          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={rows[0]?.tag} onValueChange={handleTag}>
                {tagsLabel.map((label) => (
                  <DropdownMenuRadioItem key={label?.value} value={label?.value}>
                    {label?.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>


          {((user?.userType == 'system' && findFeature(user.configs, 'sms').value) || user?.userType == 'admin') &&
            <>
              <DropdownMenuItem
                onClick={() => setShowContactDialog(true)}
              >
                New Message
                <DropdownMenuShortcut><MessageSquarePlusIcon size={18} /></DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />


            </>
          }
          {user?.userType == 'admin' &&
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSubscribed()}
              >
                Subscribe
                <DropdownMenuShortcut><Bell size={18} /></DropdownMenuShortcut>

              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUnsubscribed()}
              >
                Unsubscribe
                <DropdownMenuShortcut><BellOff size={18} /></DropdownMenuShortcut>

              </DropdownMenuItem>
            </>
          }




          {(user.userType == 'admin') &&
            <><DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowAreaDialog(true)}
              >Set Area Location</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
                <DropdownMenuShortcut><Trash size={18} /></DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
