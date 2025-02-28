"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useComponent } from "./providers/ComponentContext";
import { Button } from "./ui/button";

export default function RefreshButton() {
  const { setRefreshId, isRefreshing, setIsRefreshing } = useComponent()
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshId(Math.random());
    // setIsRefreshing(true);
    // Simulate spinning animation for 1.5s (3 spins)
    await new Promise((resolve) => setTimeout(resolve, 30000));

    setIsRefreshing(false);
    // window.location.reload()
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      // className="mr-3 hidden h-8 lg:flex"
      onClick={handleRefresh}
      className="flex items-center justify-center text-sm font-medium rounded-md px-3 h-8 gap-1 text-primary hover:text-white border border-primary hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary py-2.5 text-center me-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 disabled:opacity-50"

    >
      <RefreshCw
        className={`w-5 h-5 transition-transform ${isRefreshing ? "animate-spin" : ""
          }`}
        style={{ animationDuration: "0.5s" }}
      />
      <span className="hidden sm:inline">Refresh</span>
    </Button>

  );
}
