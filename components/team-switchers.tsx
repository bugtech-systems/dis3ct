"use client"

import * as React from "react"
import { ChevronsUpDown,GalleryVerticalEnd,Plus } from "lucide-react"

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
import { useSession } from "next-auth/react";
import axios from "axios"
import { Contact } from "@/data/schema"
import { CreateSystemForm } from "./contacts/CreateSystemForm"
import { useContact } from "./providers/ContactProvider"



export function TeamSwitchers({
  teams,
}: {
  teams?: {
    id: any
    name: string
    plan: string
  }[]
}) {
  const { data: session } = useSession() as any; // Get the session data from next-auth
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState<any>(null);
  const [systems, setSystems] = React.useState<any[]>([]);
  const { setSystem, user, setUser } = useContact();
    
    
  const handleSystems = async (e: any) => {
    setActiveTeam(e)
    setSystem(e)
    
  }


  React.useEffect(() => {
    // Fetch user details from API if session exists
    if (session?.user?.id) {
      axios.get(`/api/contacts/${session.user.phone}`)
        .then((response) => {
          setUser(response.data);

            if(response.data.userLevel !== 'admin'){
              setSystems([response.data.parNum])

            } else {
              setSystems(teams || [])
            }
            if(response.data.parNum){
              setActiveTeam(response.data.parNum)
              setSystem(response.data.parNum)
            }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
        // .finally(() => setLoading(false));
        
        
        
    }
  }, [session, teams]);
  



  return (
  <>
    <CreateSystemForm open={showNewTeamDialog} setOpen={setShowNewTeamDialog}  />
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
                  {activeTeam?.name}
                </span>
                <span className="truncate text-xs">{activeTeam?.plan}</span>
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
            {systems.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => handleSystems(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <GalleryVerticalEnd className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
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
      

    </SidebarMenu>
    </>
  )
}
