import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitchers } from "@/components/team-switchers"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { SidebarOptInForm } from "./sidebar-opt-in-form"

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar | any>) {
  return (
    <Sidebar  {...props}>
      <SidebarHeader>
        <TeamSwitchers />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
        />
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarOptInForm /> */}
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
      {/* <SidebarRail />    */}
    </Sidebar>
  )
}
