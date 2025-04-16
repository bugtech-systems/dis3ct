'use client';


import Link from "next/link"
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;


  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        Overview
      </Link>
      <Link
        href="/contacts"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/contacts') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        Contacts
      </Link>
      <Link
        href="/playground"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/playground') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        Playground
      </Link>
      <Link
        href="/tasks"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/tasks') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        Tasks
      </Link>
    </nav>
  )
}
