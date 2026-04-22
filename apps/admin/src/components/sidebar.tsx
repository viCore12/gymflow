"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNavItem,
} from "@gymflow/ui";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/customers", label: "Khách hàng", icon: "👥" },
  { href: "/check-in", label: "Check-in", icon: "✅" },
  { href: "/packages", label: "Gói dịch vụ", icon: "📦" },
  { href: "/staff", label: "Nhân viên", icon: "👔" },
  { href: "/inventory", label: "Kho hàng", icon: "🗄️" },
  { href: "/content", label: "Nội dung", icon: "📝" },
];

interface AdminSidebarProps {
  currentPath?: string;
}

export function AdminSidebar({ currentPath = "/" }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sidebar collapsed={collapsed}>
      <SidebarHeader>
        {!collapsed && (
          <span className="text-lg font-bold text-white">GymFlow</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={currentPath === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <p className="text-xs text-gray-400">GymFlow v0.1.0</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
