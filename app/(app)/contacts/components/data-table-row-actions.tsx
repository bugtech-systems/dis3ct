"use client"

import { Row } from "@tanstack/react-table"
import { Fingerprint, Image, ListRestartIcon, MessageCircle, MessageCircleDashedIcon, MessageCircleIcon, MessageSquareIcon, MoreHorizontal, Trash, UserCheck2Icon } from "lucide-react"

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

import { contactSchema } from "../data/schema"
import { useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { Bell, BellOff, Clipboard } from "lucide-react";
import { useComponent } from "@/components/providers/ComponentContext"
import { useContact } from "@/components/providers/ContactProvider"
import { findFeature, replaceObjectInArray } from "@/lib/helpers"
import Link from "next/link"

let tagsLabel = [{ label: 'Confirmed', value: 'confirm' }, { label: 'Undecided', value: 'undecided' }, { label: 'Declined', value: 'declined' }];


interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  table: any;
}

export function DataTableRowActions<TData>({
  row,
  table
}: DataTableRowActionsProps<TData>) {
  const contact = contactSchema.parse(row.original);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter(); // ⬅ Initialize useRouter
  const { setModal, setRecord, setRefreshId, biometricRunning, biometricConnected, setTab } = useComponent();
  const { user, system, setContactTable, contactTable, parentSystem } = useContact();


  const handleDelete = async () => {

    try {
      const response = await axios.delete(`/api/contacts/save/${contact?.id}`);
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
      const response = await axios.post(`/api/contacts/${contact._id}/${contact.subscribed ? 'unsubscribe' : 'subscribe'}`);
      if (response.data) {
        toast.success(`${contact.subscribed ? 'Unsubscribed' : 'Subscribed'} Successfully!`)
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

  const handleRestart = async () => {
    let apiUrl = '/api/tasks'
    let system = await axios.get(`/api/contacts/save/system/${contact.phone}`);

    if (system.data) {

      await axios.post(apiUrl, {
        status: 'Todo',
        priority: 'Low',
        category: 'Background',
        title: 'GSM Module',
        taskObject: JSON.stringify({
          url: `http://127.0.0.1:23006/api/gsm/restart`,
          method: 'post',
          dataObject: {
            port: system.data.port
            /* instruction */
          }
        })
      })
    }

  }

  const handleTag = async (type: any) => {
    try {
      const response = await axios.post(`/api/contacts/${contact._id}/tag`, { type, system: parentSystem?._id });


      if (response.data) {
        let newArr = replaceObjectInArray(contactTable, response.data);
        // router.refresh();

        setContactTable(replaceObjectInArray(contactTable, response.data))
        setRefreshId(Math.random())

        toast.success(`Label Updated Successfully!`)
      } else {
        toast.error("Failed to send OTP. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while sending OTP.")
      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }

  }

  const handleDeleteLeader = async () => {
    try {
      const response = await axios.post(`/api/users`, { action: 'delete', contactId: contact._id });
      if (response.data) {
        toast.success('Deleted Successfully!')
        router.refresh();

      } else {
        toast.error("Delete Failed. Please try again.")
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      toast.error("An error occurred while Deleting.")

      // setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }

  }


  let hasImg = contact?.tags.find(tg => tg.tagType == 'image');
  let parent = parentSystem ? parentSystem.parent : user.parent;


  return (
    <>
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
            onClick={() => {
              setRecord(contact)
              setModal('viewContact', contact?._id)
            }}
          >View Details</DropdownMenuItem>

          <DropdownMenuSeparator />




          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={contact?.tag} onValueChange={handleTag}>
                {tagsLabel.map((label) => (
                  <DropdownMenuRadioItem key={label?.value} value={label?.value}>
                    {label?.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {((findFeature(parent?.configs, 'biometric')?.value || (system?.userType == 'admin'))) &&
            <>
              {biometricConnected ?
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // router.replace(`/scanner.html?id=${contact._id}`)
                      setRecord(contact)
                      setModal('scannerPage', contact?._id)
                    }}
                  >
                    Set Biometrics
                    <DropdownMenuShortcut><Fingerprint size={18} color={contact?.biometric ? "blue" : "gray"} /></DropdownMenuShortcut>
                  </DropdownMenuItem>
                </>
                :
                <>
                  <DropdownMenuSeparator />
                  <Link href={`/scanner.html?id=${contact._id}`} target="_blank">
                    <DropdownMenuItem
                      onClick={() => {
                        // router.replace(`/scanner.html?id=${contact._id}`)
                        // setRecord(contact)
                        // setModal('scannerPage', contact?._id)
                      }}
                    >
                      Set Biometrics
                      <DropdownMenuShortcut><Fingerprint size={18} color={contact?.biometric ? "blue" : "gray"} /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </Link>
                </>
              }
            </>
          }

          {(findFeature(parent?.configs, 'image')?.value || (system?.userType == 'admin')) &&
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRecord(contact)
                  setModal('viewContact', contact?._id)
                  setTab('image')
                }}
              >
                Set Image
                <DropdownMenuShortcut><Image size={18} color={hasImg ? "blue" : "gray"} /></DropdownMenuShortcut>

              </DropdownMenuItem>
            </>
          }

          {(user?.userType == 'admin') &&
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSubscribed()}
              >
                {contact?.subscribed ? 'Unsubscribe' : 'Subscribe'}
                <DropdownMenuShortcut>{contact?.subscribed ? <BellOff size={18} /> : <Bell size={18} />} </DropdownMenuShortcut>

              </DropdownMenuItem>
            </>
          }
          {(findFeature(parent?.configs, 'sms')?.value || (user?.userType == 'admin')) &&
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRecord(contact)
                  setModal('sendInvite', contact?._id)
                }}
              >
                Send Invite
                <DropdownMenuShortcut><MessageSquareIcon color={contact.phone ? 'green' : 'gray'} size={18} className="text-red" /></DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          }

          {(((findFeature(parent?.configs, 'leaders')?.value || (user?.userType == 'admin')) && contact.recordType != 'leader')) &&
            <>
              <DropdownMenuItem
                onClick={() => {
                  setRecord(contact)
                  setModal('newLeader', contact?._id)
                }}
              >Set Leader</DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          }

          {(((findFeature(parent?.configs, 'leaders')?.value || (user?.userType == 'admin')) && contact.recordType == 'leader')) &&
            <>
              <DropdownMenuItem
                onClick={() => {
                  handleDeleteLeader()
                }}
              >Delete Leader Account</DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          }

          {((findFeature(parent?.configs, 'hotline')?.value || user?.userType == 'admin')) &&
            <>
              <DropdownMenuItem
                onClick={() => {
                  setRecord(contact)
                  setModal('setHotline', contact?._id)
                }}
              >Set hotline</DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          }


          {(user?.userType == 'admin') &&
            <>


              <DropdownMenuSeparator />
              {(contact?.userLevel == 'admin') &&
                <>
                  <DropdownMenuItem
                    onClick={() => handleRestart()}
                  >
                    Restart GSM
                    <DropdownMenuShortcut><ListRestartIcon size={18} /></DropdownMenuShortcut>

                  </DropdownMenuItem>
                  <DropdownMenuSeparator />



                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                    <DropdownMenuShortcut><Trash size={18} /></DropdownMenuShortcut>
                  </DropdownMenuItem>
                </>

              }


            </>
          }
        </DropdownMenuContent>

      </DropdownMenu >
    </>
  )
}
