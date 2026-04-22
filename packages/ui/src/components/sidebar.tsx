import * as React from "react";
import { cn } from "../lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false, children, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center px-4 py-5 border-b border-gray-700", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-4", className)} {...props} />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t border-gray-700 px-4 py-4", className)}
      {...props}
    />
  );
}

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  active?: boolean;
  icon?: React.ReactNode;
  label: string;
  collapsed?: boolean;
}

export function SidebarNavItem({
  className,
  href = "#",
  active = false,
  icon,
  label,
  collapsed = false,
  ...props
}: SidebarNavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary-600 text-white"
          : "text-gray-300 hover:bg-gray-800 hover:text-white",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!collapsed && <span>{label}</span>}
    </a>
  );
}
