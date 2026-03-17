"use client"

import React, { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      {isSidebarCollapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-20 top-4 z-[60] h-10 w-10 rounded-full shadow-sm"
          aria-label="Abrir sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <div
        className={isSidebarCollapsed ? "pl-[68px] transition-all duration-300" : "pl-64 transition-all duration-300"}
      >
        <main>{children}</main>
      </div>
    </div>
  );
}
