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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Maretext",
      logo: GalleryVerticalEnd,
      plan: "Organization",
    }
  ],
  navMain: [


    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      isActive: true,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: BookOpen,
      badge: "10",
    },
    {
      title: "Ask AI",
      url: "/playground",
      icon: Sparkles,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: Settings2,
    },


  ],

}

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar | any>) {
  return (
    <Sidebar  {...props}>
      <SidebarHeader>
        <TeamSwitchers teams={props.systems || []} currentUser={props.currentUser} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <SidebarOptInForm />
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
      {/* <SidebarRail />    */}
    </Sidebar>
  )
}
