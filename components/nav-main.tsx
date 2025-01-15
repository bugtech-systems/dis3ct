"use client";

import { BookOpen, PieChart, Settings2, Sparkles, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useContact } from "./providers/ContactProvider";

const navAdmin = [
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
]

const navNormal = [
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
  }
]


export function NavMain() {


  const { user } = useContact()


  const pathname = usePathname();

let items = (user && user.userLevel == 'admin') ? navAdmin : navNormal;
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.url;

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
