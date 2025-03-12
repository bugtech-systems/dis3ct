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
import { CreateLeaderFormDialog } from "./contacts/CreateLeaderForm";
import { LeaderProfileForm } from "./contacts/LeaderProfileForm";
import { useContact } from "./providers/ContactProvider";
import { useComponent } from "./providers/ComponentContext";
import getAuth from "@/actions/getAuth";
import getTeams from "@/actions/getTeams";
import { DeviceForm } from "./devices";
import { findFeature } from "@/lib/helpers";

export function UserNav({ user }: { user: any }) {
  const { modal, setModal, record } = useComponent();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setUser, setSystem, system, setParentSystem, parentSystem } = useContact();

  const handleSystems = async (e: any) => {
    // setActiveTeam(e)
    setSystem(e)
    setParentSystem(e)
    // if (e) {
    //   localStorage.setItem('system', e._id)
    // } else {
    //   localStorage.removeItem('system')
    // }
    // signOut({ callbackUrl: '/login' })
  }





  const handleAuth = async () => {

    let authUser = await getAuth();
    let parent = localStorage.getItem('system')



    if (authUser) {
      setUser(authUser);
      if (parent) {
        let authParent = await getAuth(parent);

        handleSystems(authParent);
        // setParentSystem(authUser.parent)
        return;
      } else if (authUser.userType == 'system' || authUser.userType == 'admin' || authUser.userType == 'leader') {
        handleSystems(authUser);
      }
    } else {
      handleSystems(authUser);
    }
  }


  /*  useEffect(() => {
 
 
   }, [user]) */
  useEffect(() => {
    handleAuth()


    //     axios.get(`/api/contacts/save/${activeTeam?.user}`)

    // axios.get(`/api/contacts/auth`)
    //   .then((response) => {
    //     setUser(response.data);
    //   })
    //   .catch((error) => {
    //     console.log("Error fetching user data:", error);
    //   })

  }, [user]);



  let currentUser = parentSystem;

  return (
    <>
      {open && <LeaderProfileForm profile={currentUser} open={open} setOpen={setOpen} />}
      {modal == 'newLeader' && <CreateLeaderFormDialog contact={record} type="leader" open={modal == 'newLeader'} setOpen={setModal} />}
      {modal == 'devices' && <DeviceForm />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="User Avatar" />
              <AvatarFallback>{currentUser?.name ? currentUser.name.charAt(0) : "U"}</AvatarFallback>
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
                  <p className="text-sm font-medium leading-none">{currentUser?.name || "Unknown User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.phone || "No Phone"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.userType || "No Level"}
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
            {/*            {((user?.userType == 'leader') || (user?.userType == 'admin') || (currentUser?.userType == 'system' && findFeature(currentUser.configs, 'leaders').value)) &&
              <DropdownMenuItem onClick={() => {
                setRecord({})
                setModal('newLeader')
              }}>New Leader</DropdownMenuItem>
            } */}
          </DropdownMenuGroup>
          {(user.userType == 'system' || user.userType == 'admin') &&
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setModal('devices')}
                >Configurations</DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          }
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
