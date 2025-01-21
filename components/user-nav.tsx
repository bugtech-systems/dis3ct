"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { CreateLeaderFormDialog } from "./contacts/CreateLeaderForm";
import { LeaderProfileDialogForm } from "./contacts/LeaderProfileForm";
import { Contact } from "@/data/schema";
import { useContact } from "./providers/ContactProvider";

export function UserNav() {
  const { data: session } = useSession() as any; // Get the session data from next-auth
  // const [user, setUser] = useState<Contact>();
  const [loading, setLoading] = useState(true);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const {user, setUser } = useContact()
 
 
  useEffect(() => {
    // Fetch user details from API if session exists
    if (session?.user?.id) {
      axios.get(`/api/contacts/${session.user.phone}`)
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);



  return (
    <>
      <LeaderProfileDialogForm contact={user} open={open} setOpen={setOpen} />
      <CreateLeaderFormDialog  open={showNewTeamDialog} setOpen={setShowNewTeamDialog} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="User Avatar" />
              <AvatarFallback>{user?.name ? user.name.charAt(0) : "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {loading ? (
                <p className="text-sm font-medium leading-none">Loading...</p>
              ) : (
                <>
                  <p className="text-sm font-medium leading-none">{user?.name || "Unknown User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.phone || "No Phone"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.userLevel || "No Level"}
                  </p>
                </>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setOpen(true)}
            >Profile</DropdownMenuItem>
            {(user?.userLevel !== 'barangay' && user?.userLevel !== 'admin') && 
            <DropdownMenuItem onClick={() => setShowNewTeamDialog(true)}>New Leader</DropdownMenuItem>
          }
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
