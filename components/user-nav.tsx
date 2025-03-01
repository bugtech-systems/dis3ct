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
import { LeaderProfileForm } from "./contacts/LeaderProfileForm";
import { useContact } from "./providers/ContactProvider";
import { useComponent } from "./providers/ComponentContext";
import { CreateSystemForm } from "./contacts/CreateSystemForm";
import getAuth from "@/actions/getAuth";
import getTeams from "@/actions/getTeams";

export function UserNav({ user }: { user: any }) {
  const { modal, setModal } = useComponent();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setUser, setSystem, system, setTeams } = useContact();

  const handleSystems = async (e: any) => {
    // setActiveTeam(e)
    setSystem(e)
    if (e) {
      localStorage.setItem('system', e._id)
    } else {
      localStorage.removeItem('system')
    }
    // signOut({ callbackUrl: '/login' })
  }



  const handleAuth = async () => {

    let authUser = await getAuth();
    let teamData = await getTeams();

    if (authUser) {
      setUser(authUser);
      if (teamData.length) {
        setTeams(teamData)
      }
      let parent = localStorage.getItem('system')
      if (parent) {
        let sys = teamData?.find(team => team._id == parent);
        if (sys) {

          handleSystems(sys)
        } else if (authUser && authUser.parent) {
          handleSystems(authUser.parent);

        } else if (authUser.userType == 'system' || authUser.userType == 'admin') {
          handleSystems(authUser);
        }
        return;


      } else if (authUser && authUser.parent) {
        handleSystems(authUser.parent);

      } else if (authUser.userType == 'system' || authUser.userType == 'admin') {
        handleSystems(authUser);
      }

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

  let currentUser = user?.userType == 'admin' ? system : user;

  return (
    <>
      <LeaderProfileForm profile={currentUser} open={open} setOpen={setOpen} />
      <CreateLeaderFormDialog contact={currentUser} type="new" open={modal == 'newLeader'} setOpen={setModal} />
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
            {(currentUser?.userType == 'system') &&
              <DropdownMenuItem onClick={() => setModal('newLeader')}>New Leader</DropdownMenuItem>
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
