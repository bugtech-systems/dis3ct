"use client"

import * as React from "react"
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



export function TeamSwitchers({
  teams,
}: {
  teams?: {
    id: any
    name: string
    plan: string
  }[]
}) {
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState<any>((teams && teams[0]) ?? null);
  const { setSystem, system, user, setUser } = useContact();

  const handleSystems = async (e: any) => {
    console.log(e, 'sysss')
    setActiveTeam(e)
    setSystem(e)
    if (e) {
      localStorage.setItem('system', e.id)
    }
    // signOut({ callbackUrl: '/login' })
  }


  React.useEffect(() => {
    // Fetch user details from API if session exists
    let parent = localStorage.getItem('system')
    if (parent) {
      let sys = teams?.find(team => team.id == parent);
      console.log(sys, teams, 'SYSSF', parent)
      setSystem(sys)
      setActiveTeam(sys)
      localStorage.setItem('system', sys?.id)

    } else {

      setSystem(teams ? teams[0] : null)
      setActiveTeam(teams ? teams[0] : null)
      if (teams) {
        localStorage.setItem('system', teams[0].id)
      }
    }


  }, [teams]);

  React.useEffect(() => {
    // Fetch user details from API if session exists
    if (activeTeam?.user) {
      axios.get(`/api/contacts/save/${activeTeam?.user}`)
        .then((response) => {
          setUser(response.data);


        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
      // .finally(() => setLoading(false));
    }
  }, [activeTeam]);






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
                  <span className="truncate text-xs">{system?.plan}</span>
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
              {system &&
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
              {user?.userLevel == 'admin' &&
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
