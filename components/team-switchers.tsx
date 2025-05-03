"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import axios from "axios";
import { useContact } from "./providers/ContactProvider";

export function TeamSwitchers({ currentUser }: { currentUser?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();
  const { system, user, setParentSystem } = useContact();
  const [teams, setTeams] = React.useState<any[]>([]);
  const [activeTeam, setActiveTeam] = React.useState<any>(null);
  // const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);

  const updateUrlParams = (team: any) => {
    const params = new URLSearchParams(window.location.search);
    if (team?.accessCode) {
      params.set("team", team.accessCode);
    } else {
      params.delete("team");
    }
    router.push(`?${params.toString()}`);
  };

  const handleSystems = async (team: any) => {
    console.log(team, 'handlesystem')
    setActiveTeam(team);
    // setSystem(team);
    updateUrlParams(team);
    setParentSystem(team);
    localStorage.setItem("system", JSON.stringify(team) || "");
  };

  const handleGetSystems = async (authUser: any) => {
    try {
      const response = await axios.get(
        `/api/location/barangays/${authUser?.accessCode}`
      );
      const { data } = response.data;
      setTeams(
        data.map((a: any) => ({
          name: a.brgyDesc,
          accessCode: a.brgyCode,
          userType: "Barangay",
        }))
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  React.useEffect(() => {
    let active = localStorage.getItem('system');

    if (system || (active && JSON.parse(active))) {
      handleSystems(system || (active && JSON.parse(active)));
    }
  }, [user]);

  React.useEffect(() => {
    if (activeTeam && String(activeTeam.accessCode).length == 6) {
      handleGetSystems(activeTeam);
    }
  }, [activeTeam]);


  console.log(system, 'ATCIVE', activeTeam)
  return (
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
                  {activeTeam?.name || "Select Team"}
                </span>
                <span className="truncate text-xs">{activeTeam?.userType}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            // className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-h-80 overflow-y-auto"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            <div
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-h-80 overflow-y-auto"
            >
              {teams
                ?.filter((team) => team?.accessCode !== user?.accessCode)
                .map((team, index) => (
                  <DropdownMenuItem
                    key={team.accessCode}
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
            </div>
            {activeTeam && user?.accessCode !== activeTeam.accessCode && (
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
            )}

            <DropdownMenuSeparator />

            {/* {user?.userType === "admin" && (
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setShowNewTeamDialog(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add team</div>
              </DropdownMenuItem>
            )} */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
