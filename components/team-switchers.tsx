"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react";
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

  const updateUrlParams = (teamCode: string) => {
    const params = new URLSearchParams(window.location.search);
    console.log(params.toString(), 'PR1')
    if (teamCode) {
      params.set("team", teamCode);
      params.delete("tag");
    } else {
      params.delete("team");
    }

    console.log(params.toString(), 'PR2')
    router.push(`?${params.toString()}`);
  };

  const handleSystems = (team: any) => {
    setActiveTeam(team);
    setParentSystem(team);
    localStorage.setItem("system", JSON.stringify(team));
    console.log(team, 'AA')
    updateUrlParams(team?.accessCode);
  };

  const handleGetSystems = async (authUser: any) => {
    try {
      const response = await axios.get(`/api/location/barangays/${authUser?.accessCode}`);
      const { data } = response.data;
      setTeams(
        data.map((a: any) => ({
          name: a.brgyDesc,
          accessCode: a.brgyCode,
          userType: "Barangay",
        }))
      );
    } catch (error) {
      console.error("Error fetching barangays:", error);
    }
  };

  // On mount: set team from localStorage if exists
  React.useEffect(() => {
    const savedSystem = localStorage.getItem("system");
    if (savedSystem) {
      try {
        const parsed = JSON.parse(savedSystem);
        if (parsed?.accessCode) {
          handleSystems(parsed);
        }
      } catch (e) {
        console.warn("Failed to parse saved team from localStorage.");
      }
    }
  }, []);

  // When `user` changes, re-fetch barangay list
  React.useEffect(() => {
    console.log(currentUser, 'CURRR')
    if (currentUser?.accessCode) {
      handleGetSystems(currentUser);
    }
  }, [currentUser]);

  // React.useEffect(() => {
  //   if (activeTeam?.accessCode) {
  //     handleGetSystems(activeTeam);
  //   }
  // }, [activeTeam]);

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
                <span className="truncate text-xs">
                  {activeTeam?.userType || ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            <div className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-h-80 overflow-y-auto">
              {teams
                ?.filter((team) => team?.accessCode !== activeTeam?.accessCode)
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
