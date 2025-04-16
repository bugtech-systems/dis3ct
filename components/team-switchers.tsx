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



export function TeamSwitchers({
  currentUser
}: {
  currentUser?: any
}) {
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const { isMobile } = useSidebar()
  const { setSystem, system, user, setParentSystem } = useContact();
  const [teams, setTeams] = React.useState<any>([]);
  const [activeTeam, setActiveTeam] = React.useState<any>(null);

  const handleSystems = async (e: any) => {
    setActiveTeam(e)
    // setTeams([])
    // setSystem(e)
    setParentSystem(e)
    // setRefreshId(Math.random())
    if (e) {
      localStorage.setItem('system', e?._id)
    }
    // signOut({ callbackUrl: '/login' })
  }


  const handleGetSystems = async (authUser) => {
    await axios.get(`/api/users?userId=${authUser?._id}`)
      .then((response) => {
        setTeams(response.data)

      })
      .catch((error) => {
        console.log("Error fetching user data:", error);
      })
    // let teamData = await getTeams(authUser?._id);
    // console.log(teamData, 'authUSER0', authUser)
  }


  React.useEffect(() => {
    // if(user)

    // Fetch user details from API if session exists
    // handleGetSystems(system?._id)
    // handleAuth()

    // handleGetSystems(user)
    handleSystems(system);
    return () => {

      // setActiveTeam(null)
    }
  }, [user, system]);

  React.useEffect(() => {
    if (activeTeam) {
      handleGetSystems(activeTeam)
    }

  }, [activeTeam])



  // console.log(teams, 'TEAMS')
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
            {(teams.length >= 0) ?
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
                      {activeTeam?.name}
                    </span>
                    <span className="truncate text-xs">{activeTeam?.userType}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              :
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeTeam?.name}
                  </span>
                  <span className="truncate text-xs">{activeTeam?.userType}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuLabel>
              {teams?.filter(team => (team?._id != user?._id)).map((team, index) => (
                <DropdownMenuItem
                  key={team?._id}
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
              {(activeTeam && user?._id != activeTeam._id) &&
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleSystems(user)}
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
