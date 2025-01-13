"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitchers } from "@/components/team-switchers"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import TeamSwitcher from "@/app/(app)/dashboard/components/team-switcher"
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
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
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
    /*   {
        title: "Ask AI",
        url: "/playground",
        icon: Sparkles,
      },
      {
        title: "Tasks",
        url: "/tasks",
        icon: Settings2,
      }, */
      

  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar  {...props}>
      <SidebarHeader>
        <TeamSwitchers teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
      <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
          <SidebarOptInForm />
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
     {/* <SidebarRail />    */}
    </Sidebar>
  )
}
