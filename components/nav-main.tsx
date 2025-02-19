"use client";

import { BookOpen, PieChart, Settings2, Sparkles, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useContact } from "./providers/ContactProvider";
import axios from "axios";
import { useCallback, useEffect } from "react";

const navAdmin = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PieChart,
    isActive: true,
  },
  {
    title: "Records",
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

const navSystem = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PieChart,
    isActive: true,
  },
  {
    title: "Records",
    url: "/contacts",
    icon: BookOpen,
    badge: "10",
  },
  {
    title: "Ask AI",
    url: "/playground",
    icon: Sparkles,
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
    title: "Records",
    url: "/contacts",
    icon: BookOpen,
    badge: "10",
  }


]


export function NavMain() {


  const { user, setUser } = useContact()


  const pathname = usePathname();
  let items = (user && user.userLevel == 'admin') ? navAdmin : (user && (user.userLevel == 'system' && user.subscription == 'pro')) ? navSystem : navNormal;


  // Fetch user data and set it in context
  const handleGetUser = useCallback(async () => {
    try {
      const userData = await fetch("/api/contacts/auth").then((res) =>
        res.json()
      );


      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.log("Error fetching user data:", err);
    }
  }, [setUser]);

  // Fetch user on mount
  useEffect(() => {
    if (!user) {
      handleGetUser();
    }
  }, []);



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
