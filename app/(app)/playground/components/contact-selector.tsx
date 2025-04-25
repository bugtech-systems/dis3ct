"use client"

import * as React from "react"
import { PopoverProps } from "@radix-ui/react-popover"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { usePlayground } from "@/components/providers/PlaygroundProvider"
import { Contact } from "@/data/schema"
import { useContact } from "@/components/providers/ContactProvider"
import { sanitizePhoneNumber } from "@/lib/helpers"
import axios from "axios"
import toast from "react-hot-toast"

interface ContactSelectorProps extends PopoverProps {
  contacts: Contact[]
}

export function ContactSelector() {
  const { system, parentSystem } = useContact()
  const { selectedContact, setSelectedContact } = usePlayground()
  const [open, setOpen] = React.useState(false)
  const [contacts, setContacts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchString, setSearchString] = React.useState("")
  const parent = (parentSystem && parentSystem?.parent?._id) ? parentSystem.parent : parentSystem

  const removeDuplicates = (arr) => {
    const uniquePhones = new Map()
    return arr.filter(item => {
      if (!uniquePhones.has(item.phone)) {
        uniquePhones.set(item.phone, true)
        return true
      }
      return false
    })
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/public/mobiles?system=${parent?.phone}`)
      if (!response.ok) throw new Error("Failed to fetch contacts")
      const dataRes = await response.json()
      if (dataRes) {
        console.log(dataRes)
        let newContacts = removeDuplicates(dataRes.filter((e: any) => e.phone))
        console.log(newContacts, 'CONTS')
        setContacts(newContacts)
      }
    } catch (err: any) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (phone) => {
    try {

      if (sanitizePhoneNumber(phone)?.length != 10) return toast.error('Invalid Mobile Number')

      const response = await axios.post(`/api/public/mobiles?system=${parent?.phone}`, {
        phone: sanitizePhoneNumber(phone),
        system: parent?.phone
      })
      console.log(response.data)
      if (response.status == 200) {
        toast.success(response.data.message)
        setSearchString('')
        await fetchContacts()
      }

    } catch (err: any) {
      console.log(err.response, 'ERR')
      toast.error('Something went wrong!')
    } finally {
      setLoading(false)
    }
  }



  React.useEffect(() => {
    if (parent) fetchContacts()
  }, [parent])

  const normalizedSearch = sanitizePhoneNumber(searchString)
  const isPhoneExisting = contacts.some(contact =>
    sanitizePhoneNumber(contact?.phone) === normalizedSearch
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Load a contact..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedContact ? selectedContact.phone : "Load a contact..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search contacts..."
            value={searchString}
            onValueChange={setSearchString}
          />
          <CommandList>
            {loading && <CommandEmpty>Loading contacts...</CommandEmpty>}
            {error && <CommandEmpty>{error}</CommandEmpty>}
            {!loading && !error && contacts.length === 0 && (
              <CommandEmpty>No contacts found.</CommandEmpty>
            )}

            {selectedContact && (
              <CommandGroup className="pt-2">
                <CommandItem
                  onSelect={() => {
                    setSelectedContact(null)
                    setOpen(false)
                  }}
                >
                  Clear Selection
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Contacts">
              {contacts.map((contact: any, index: number) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    setSelectedContact(contact)
                    setOpen(false)
                  }}
                >
                  {contact.phone}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedContact?.phone === contact.phone
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            {!loading && !error && searchString && !isPhoneExisting && (
              <CommandGroup heading="No Match">
                <CommandItem
                  className="text-primary"
                  onSelect={() => {
                    setSelectedContact({ phone: searchString })
                    handleSave(searchString)
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add “{searchString}” as new contact
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
