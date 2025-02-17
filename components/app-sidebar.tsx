import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitchers } from "@/components/team-switchers"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarOptInForm } from "./sidebar-opt-in-form"

import {
  AudioWaveform,
  // Blocks,
  // Calendar,
  Command,
  BookOpen,
  PieChart,
  MessageCircleQuestion,
  Settings2,
  Sparkles,
  GalleryVerticalEnd
} from "lucide-react"



export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar | any>) {
  return (
    <Sidebar  {...props}>
      <SidebarHeader>
        <TeamSwitchers teams={props.systems || []} currentUser={props.currentuser} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarOptInForm />
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
      {/* <SidebarRail />    */}
    </Sidebar>
  )
}
