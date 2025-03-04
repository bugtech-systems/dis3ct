"use client"

import * as React from "react"
import { PopoverProps } from "@radix-ui/react-popover"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMutationObserver } from "@/hooks/use-mutation-observer"
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { usePlayground } from "@/components/providers/PlaygroundProvider"
import { Contact } from "@/data/schema"
import { useContact } from "@/components/providers/ContactProvider"

interface ContactSelectorProps extends PopoverProps {
  contacts: Contact[]
}

export function ContactSelector() {
  const { system } = useContact()
  const { selectedContact, setSelectedContact } = usePlayground()
  const [open, setOpen] = React.useState(false)
  const [contacts, setContacts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/contacts?system=${system?._id}&phone=true`)
      if (!response.ok) {
        throw new Error("Failed to fetch contacts")
      }
      const dataRes = await response.json();

      console.log(dataRes, 'RRESE')
      if (dataRes) {
        let { data } = dataRes;
        setContacts(data) // Assuming API returns { success: true, data: [...] }
      }
    } catch (err: any) {
      console.log(err)
      // setError(err.message || "An unexpected error occurred")
    } finally {

      setLoading(false)
    }
  }

  // Fetch contacts from the API
  React.useEffect(() => {

    if (system) {
      fetchContacts()
    }
  }, [system])

  console.log(system, 'play system')

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
          {selectedContact ? selectedContact.phone : "Load a contacts..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search contacts..." />
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
                      selectedContact?.phone == contact.phone
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ContactItemProps {
  model: Contact
  isSelected: boolean
  onSelect: () => void
  onPeek: (model: Contact) => void
}

function ContactItem({ model, isSelected, onSelect, onPeek }: ContactItemProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  useMutationObserver(ref, (mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "aria-selected" &&
        ref.current?.getAttribute("aria-selected") === "true"
      ) {
        onPeek(model)
      }
    })
  })

  return (
    <CommandItem
      key={model.id}
      onSelect={onSelect}
      ref={ref}
      className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
    >
      {model.name}
      <Check
        className={cn("ml-auto", isSelected ? "opacity-100" : "opacity-0")}
      />
    </CommandItem>
  )
}
