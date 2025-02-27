"use client"
import * as React from "react"
import { useSession } from "next-auth/react";
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import axios from "axios"
import { CreateSystemForm } from "./contacts/CreateSystemForm"
import { useContact } from "./providers/ContactProvider"
import { signOut } from "next-auth/react"
import getAuth from "@/actions/getAuth";
import getTeams from "@/actions/getTeams";



export function TeamSwitchers({
  currentUser
}: {
  currentUser?: any
}) {
  const { data: session, status } = useSession();
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const { isMobile } = useSidebar()
  const [teams, setTeams] = React.useState<any>([]);
  const [activeTeam, setActiveTeam] = React.useState<any>((teams && teams[0]) ?? null);
  const { setSystem, system, user, setUser } = useContact();

  const handleSystems = async (e: any) => {
    setActiveTeam(e)
    setSystem(e)
    if (e) {
      localStorage.setItem('system', e._id)
    } else {
      localStorage.removeItem('system')
    }
    // signOut({ callbackUrl: '/login' })
  }

  const handleTeams = async () => {
    let teamData = await getTeams();
    if (teamData.length >= 1) {
      setTeams(teamData)

    }

  }

  const handleAuth = async () => {
    let authUser = await getAuth();
    if (authUser && authUser.parent) {
      handleSystems(authUser.parent);
    }
  }


  React.useEffect(() => {
    // if(user)

    // Fetch user details from API if session exists

    // handleAuth()

    let parent = localStorage.getItem('system')
    if (parent) {
      let sys = teams?.find(team => team._id == parent);
      if (sys) {

        handleSystems(sys)
      } else {
        // localStorage.removeItem('system');
      }
      return;
    } else if (user && user.parent) {
      let sys = teams?.find(team => (team._id == user.parent || team._id == user.parent?._id));
      setSystem(sys)
      setActiveTeam(sys)
      localStorage.setItem('system', sys?._id);
      return;
    } else {
      handleAuth()
    }
  }, [teams]);

  React.useEffect(() => {

    handleTeams()


  }, [])


  // React.useEffect(() => {

  //   if (currentUser) {
  //     //     axios.get(`/api/contacts/save/${activeTeam?.user}`)

  //     axios.get(`/api/contacts/save/${currentUser?._id}`)
  //       .then((response) => {
  //         setUser(response.data);
  //       })
  //       .catch((error) => {
  //         console.log("Error fetching user data:", error);
  //       })
  //   }

  // }, [currentUser]);


  // console.log(session, 'SESSION')

  return (
    <>
      <CreateSystemForm open={showNewTeamDialog} setOpen={setShowNewTeamDialog} />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {system?.name}
                  </span>
                  <span className="truncate text-xs">{system?.userType}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuLabel>
              {teams?.map((team, index) => (
                <DropdownMenuItem
                  key={team?.name}
                  onClick={() => handleSystems(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <GalleryVerticalEnd className="size-4 shrink-0" />
                  </div>
                  {team?.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              {(system && user?.userType == 'admin') &&
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleSystems(null)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <GalleryVerticalEnd className="size-4 shrink-0" />
                    </div>
                    Clear Selection
                  </DropdownMenuItem>
                </>
              }
              <DropdownMenuSeparator />
              {user?.userType == 'admin' &&
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>

                  <div className="font-medium text-muted-foreground"
                    onClick={() => {
                      setShowNewTeamDialog(true)
                    }}
                  >Add team</div>
                </DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>


      </SidebarMenu >
    </>
  )
}
