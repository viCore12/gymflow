"use client";

import { signOut } from "next-auth/react";
import { Button } from "@gymflow/ui";

interface TopbarProps {
  breadcrumb?: string;
  userEmail?: string;
}

export function Topbar({ breadcrumb = "Dashboard", userEmail }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-sm text-gray-600">{userEmail}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
